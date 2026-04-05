import prisma from '../lib/prisma';
import { cacheable, cacheDelete } from '../lib/redis';
import { BadRequestError } from '../middleware/error-handler';
import * as chatService from './chat.service';
import * as notificationService from './notification.service';
import type {
    UpdateMerchantProfileInput,
    CreateMerchantServiceInput,
    UpdateMerchantServiceInput,
    CreateAgentInput,
    UpdateAgentInput,
    CreateSlotsInput,
    AssignAgentInput,
    SubmitKycDocInput,
    CreatePromotionInput,
    UpdatePromotionInput,
} from '../validators/merchant.validators';

// ─── Dashboard ───

export async function getDashboard(userId: string) {
    return cacheable(`merchant:dash:${userId}`, 60, async () => {
        const profile = await prisma.merchantProfile.findUnique({
            where: { userId },
        });
        if (!profile) throw new BadRequestError('Merchant profile not found');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayOrders, activeOrders, pendingOrders, agentCount, revenueResult] = await Promise.all([
            prisma.booking.count({
                where: { merchantId: userId, scheduledAt: { gte: today, lt: tomorrow } },
            }),
            prisma.booking.count({
                where: { merchantId: userId, status: { in: ['ACCEPTED', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } },
            }),
            prisma.booking.count({
                where: { merchantId: userId, status: 'PENDING' },
            }),
            prisma.agent.count({
                where: { merchantId: profile.id, isActive: true },
            }),
            prisma.booking.aggregate({
                where: { merchantId: userId, status: 'COMPLETED', completedAt: { gte: today } },
                _sum: { total: true },
            }),
        ]);

        return {
            todayRevenue: revenueResult._sum.total || 0,
            todayOrders,
            activeOrders,
            pendingOrders,
            agentCount,
            rating: profile.rating,
            totalReviews: profile.totalReviews,
            verificationStatus: profile.verificationStatus,
        };
    });
}

// ─── Merchant Services (Catalog) ───

export async function listMerchantServices(userId: string) {
    const profile = await getMerchantProfile(userId);
    return cacheable(`merchant:services:${profile.id}`, 300, () =>
        prisma.merchantService.findMany({
            where: { merchantId: profile.id },
            include: { service: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
        }),
    );
}

export async function enableService(userId: string, data: CreateMerchantServiceInput) {
    const profile = await getMerchantProfile(userId);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new BadRequestError('Service not found');

    const result = await prisma.merchantService.upsert({
        where: { merchantId_serviceId: { merchantId: profile.id, serviceId: data.serviceId } },
        create: { 
            merchantId: profile.id, 
            serviceId: data.serviceId, 
            price: data.price,
            unit: data.unit,
            description: data.description,
        },
        update: { 
            price: data.price, 
            unit: data.unit,
            description: data.description,
            isActive: true 
        },
        include: { service: true },
    });
    await cacheDelete(`merchant:services:${profile.id}`);
    return result;
}

export async function updateMerchantService(userId: string, id: string, data: UpdateMerchantServiceInput) {
    const profile = await getMerchantProfile(userId);
    const ms = await prisma.merchantService.findFirst({ where: { id, merchantId: profile.id } });
    if (!ms) throw new BadRequestError('Merchant service not found');

    const result = await prisma.merchantService.update({
        where: { id },
        data,
        include: { service: true },
    });
    await cacheDelete(`merchant:services:${profile.id}`);
    return result;
}

export async function disableService(userId: string, id: string) {
    const profile = await getMerchantProfile(userId);
    const ms = await prisma.merchantService.findFirst({ where: { id, merchantId: profile.id } });
    if (!ms) throw new BadRequestError('Merchant service not found');

    const result = await prisma.merchantService.update({
        where: { id },
        data: { isActive: false },
    });
    await cacheDelete(`merchant:services:${profile.id}`);
    return result;
}

export async function createCustomService(
    userId: string,
    data: {
        name: string;
        description?: string;
        categoryId: string;
        price: number;
        duration?: number;
        unit?: string;
        imageUrl?: string;
    },
) {
    const profile = await getMerchantProfile(userId);

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new BadRequestError('Category not found');

    // Auto-generate slug from name
    const baseSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const uniqueSuffix = Date.now().toString(36);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // Create the service + auto-link to this merchant in a single transaction
    return prisma.$transaction(async (tx) => {
        const service = await tx.service.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                categoryId: data.categoryId,
                basePrice: data.price,
                duration: data.duration || 60,
                unit: (data.unit as any) || 'per_visit',
                imageUrl: data.imageUrl,
            },
        });

        const merchantService = await tx.merchantService.create({
            data: {
                merchantId: profile.id,
                serviceId: service.id,
                price: data.price,
            },
            include: { service: { include: { category: true } } },
        });

        return merchantService;
    });
}

// ─── Merchant Orders ───

export async function listMerchantOrders(
    userId: string,
    options: { status?: string; page?: number; limit?: number },
) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { merchantId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
                address: true,
                items: { include: { service: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.booking.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMerchantOrder(merchantUserId: string, bookingId: string) {
    const merchant = await getMerchantProfile(merchantUserId);

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, merchantId: merchant.id },
        include: {
            customer: { select: { id: true, name: true, phone: true, email: true } },
            items: { include: { service: { select: { name: true, duration: true } } } },
            address: true,
            agent: { include: { user: { select: { name: true, phone: true } } } },
        },
    });

    if (!booking) throw new BadRequestError('Booking not found');
    return booking;
}

export async function acceptOrder(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, merchantId: userId, status: 'PENDING' },
    });
    if (!booking) throw new BadRequestError('Booking not found or not in PENDING status');

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ACCEPTED' },
        include: { items: { include: { service: true } }, address: true },
    });
}

export async function rejectOrder(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, merchantId: userId, status: 'PENDING' },
    });
    if (!booking) throw new BadRequestError('Booking not found or not in PENDING status');

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'REJECTED' },
    });
}

export async function assignAgent(userId: string, bookingId: string, data: AssignAgentInput) {
    const profile = await getMerchantProfile(userId);

    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, merchantId: userId, status: 'ACCEPTED' },
    });
    if (!booking) throw new BadRequestError('Booking not found or not in ACCEPTED status');

    const agent = await prisma.agent.findFirst({
        where: { id: data.agentId, merchantId: profile.id, isActive: true },
    });
    if (!agent) throw new BadRequestError('Agent not found or inactive');

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'AGENT_ASSIGNED', agentId: agent.id },
        include: { items: { include: { service: true } }, address: true, agent: { include: { user: { select: { name: true, phone: true } } } } },
    });
}

// ─── Agent Management ───

export async function listAgents(userId: string) {
    const profile = await getMerchantProfile(userId);
    return prisma.agent.findMany({
        where: { merchantId: profile.id },
        include: { user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createAgent(userId: string, data: CreateAgentInput) {
    const profile = await getMerchantProfile(userId);

    // Create the user account for the agent
    let agentUser = await prisma.user.findFirst({
        where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
    });

    if (!agentUser) {
        agentUser = await prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                role: 'AGENT',
                authProvider: 'PHONE',
                status: 'ONBOARDING',
            },
        });
    }

    // Check if already an agent
    const existingAgent = await prisma.agent.findUnique({ where: { userId: agentUser.id } });
    if (existingAgent) throw new BadRequestError('User is already registered as an agent');

    return prisma.agent.create({
        data: {
            userId: agentUser.id,
            merchantId: profile.id,
            skills: data.skills,
        },
        include: { user: { select: { id: true, name: true, phone: true, email: true } } },
    });
}

export async function updateAgent(userId: string, agentId: string, data: UpdateAgentInput) {
    const profile = await getMerchantProfile(userId);
    const agent = await prisma.agent.findFirst({ where: { id: agentId, merchantId: profile.id } });
    if (!agent) throw new BadRequestError('Agent not found');

    return prisma.agent.update({
        where: { id: agentId },
        data,
        include: { user: { select: { id: true, name: true, phone: true, email: true } } },
    });
}

// ─── Slot Management ───

export async function listSlots(userId: string, date?: string) {
    const profile = await getMerchantProfile(userId);
    const where: Record<string, unknown> = { merchantId: profile.id };

    if (date) {
        const d = new Date(date);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        where.date = { gte: d, lt: nextDay };
    }

    return prisma.slot.findMany({
        where,
        include: { agent: { include: { user: { select: { name: true } } } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
}

export async function createSlots(userId: string, data: CreateSlotsInput) {
    const profile = await getMerchantProfile(userId);
    const slotDate = new Date(data.date);

    const slotsData = data.slots.map((s: { startTime: string; endTime: string; agentId: string }) => ({
        merchantId: profile.id,
        date: slotDate,
        startTime: s.startTime,
        endTime: s.endTime,
        agentId: s.agentId,
    }));

    return prisma.slot.createMany({ data: slotsData });
}

// ─── Earnings ───

export async function getEarnings(
    userId: string,
    options: { period?: 'day' | 'week' | 'month'; page?: number; limit?: number },
) {
    const { period = 'month', page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const now = new Date();
    const startDate = new Date();
    if (period === 'day') startDate.setHours(0, 0, 0, 0);
    else if (period === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);

    const [completedBookings, total, aggregate] = await Promise.all([
        prisma.booking.findMany({
            where: { merchantId: userId, status: 'COMPLETED', completedAt: { gte: startDate } },
            include: { items: { include: { service: true } }, customer: { select: { name: true } } },
            orderBy: { completedAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.booking.count({
            where: { merchantId: userId, status: 'COMPLETED', completedAt: { gte: startDate } },
        }),
        prisma.booking.aggregate({
            where: { merchantId: userId, status: 'COMPLETED', completedAt: { gte: startDate } },
            _sum: { total: true, subtotal: true, tax: true },
            _count: true,
        }),
    ]);

    return {
        earnings: {
            totalRevenue: aggregate._sum.total || 0,
            subtotal: aggregate._sum.subtotal || 0,
            taxCollected: aggregate._sum.tax || 0,
            orderCount: aggregate._count,
        },
        bookings: completedBookings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

// ─── KYC / Verification ───

export async function submitKycDoc(userId: string, data: SubmitKycDocInput) {
    const profile = await getMerchantProfile(userId);

    const doc = await prisma.verificationDoc.create({
        data: {
            merchantId: profile.id,
            type: data.type,
            fileUrl: data.fileUrl,
        },
    });

    // Update merchant verification status if first submission
    if (profile.verificationStatus === 'NOT_SUBMITTED') {
        await prisma.merchantProfile.update({
            where: { id: profile.id },
            data: { verificationStatus: 'PENDING_REVIEW' },
        });
    }

    return doc;
}

// ─── Promotions ───

export async function listPromotions(userId: string) {
    const profile = await getMerchantProfile(userId);
    return prisma.promotion.findMany({
        where: { merchantId: profile.id },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createPromotion(userId: string, data: CreatePromotionInput) {
    const profile = await getMerchantProfile(userId);

    const existing = await prisma.promotion.findUnique({
        where: { code: data.code },
    });
    if (existing) throw new BadRequestError('Promotion code already exists');

    return prisma.promotion.create({
        data: {
            ...data,
            merchantId: profile.id,
        },
    });
}

export async function updatePromotion(userId: string, id: string, data: UpdatePromotionInput) {
    const profile = await getMerchantProfile(userId);

    const promo = await prisma.promotion.findFirst({
        where: { id, merchantId: profile.id },
    });
    if (!promo) throw new BadRequestError('Promotion not found');

    return prisma.promotion.update({
        where: { id },
        data,
    });
}

// ─── Analytics ───

export async function getAnalytics(userId: string, periodDays: number = 30) {
    const profile = await getMerchantProfile(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // 1. Revenue Trends
    const bookings = await prisma.booking.findMany({
        where: { merchantId: profile.id, status: 'COMPLETED', completedAt: { gte: startDate } },
        select: { completedAt: true, total: true }
    });

    const revenueByDay = bookings.reduce((acc, booking) => {
        if (!booking.completedAt) return acc;
        const dateStr = booking.completedAt.toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + booking.total;
        return acc;
    }, {} as Record<string, number>);

    const revenueTrends = Object.entries(revenueByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Top Services
    const items = await prisma.bookingItem.findMany({
        where: { booking: { merchantId: profile.id, status: 'COMPLETED', completedAt: { gte: startDate } } },
        include: { service: { select: { name: true } } }
    });

    const serviceStats = items.reduce((acc, item) => {
        if (!acc[item.serviceId]) {
            acc[item.serviceId] = { id: item.serviceId, name: item.service?.name || 'Unknown', count: 0, revenue: 0 };
        }
        acc[item.serviceId].count += item.quantity;
        acc[item.serviceId].revenue += item.price * item.quantity;
        return acc;
    }, {} as Record<string, { id: string, name: string, count: number, revenue: number }>);

    const topServices = Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // 3. Agent Performance — fetch agents with user name + count completed bookings
    // Single query instead of N+1 per-agent count
    const [agentList, agentBookingGroups] = await Promise.all([
        prisma.agent.findMany({
            where: { merchantId: profile.id },
            include: { user: { select: { name: true } } },
        }),
        prisma.booking.groupBy({
            by: ['agentId'],
            where: { 
                agent: { merchantId: profile.id }, 
                status: 'COMPLETED', 
                completedAt: { gte: startDate },
                agentId: { not: null },
            },
            _count: { id: true },
        }),
    ]);

    const agentCountMap = new Map(
        agentBookingGroups.map(g => [g.agentId, g._count.id])
    );

    const topAgents = agentList
        .map((a) => ({
            id: a.id,
            name: a.user?.name || 'Unknown',
            rating: a.rating,
            completedJobs: agentCountMap.get(a.id) || 0,
        }))
        .sort((a, b) => b.completedJobs - a.completedJobs)
        .slice(0, 5);

    return {
        revenueTrends,
        topServices,
        topAgents,
    };
}

// ─── Settings ───

export async function getSettings(userId: string) {
    const profile = await prisma.merchantProfile.findUnique({
        where: { userId },
        include: { verificationDocs: true },
    });
    if (!profile) throw new BadRequestError('Merchant profile not found');
    return profile;
}

export async function updateSettings(userId: string, data: UpdateMerchantProfileInput) {
    const profile = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestError('Merchant profile not found');

    return prisma.merchantProfile.update({
        where: { userId },
        data,
    });
}

// ─── Reviews ───

export async function listReviews(
    userId: string,
    options: { page?: number; limit?: number } = {},
) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const profile = await getMerchantProfile(userId);

    // Reviews are on bookings that belong to this merchant (via merchantId = userId on bookings)
    const [reviews, total, avgResult] = await Promise.all([
        prisma.review.findMany({
            where: { booking: { merchantId: userId } },
            include: {
                user: { select: { name: true, avatarUrl: true } },
                booking: { select: { bookingNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.review.count({ where: { booking: { merchantId: userId } } }),
        prisma.review.aggregate({
            where: { booking: { merchantId: userId } },
            _avg: { rating: true },
        }),
    ]);

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        avgRating: avgResult._avg.rating || 0,
    };
}

export async function replyToReview(userId: string, reviewId: string, reply: string) {
    // Verify the review belongs to this merchant's booking
    const review = await prisma.review.findFirst({
        where: { id: reviewId, booking: { merchantId: userId } },
    });
    if (!review) throw new BadRequestError('Review not found');

    return prisma.review.update({
        where: { id: reviewId },
        data: { merchantReply: reply, merchantReplyAt: new Date() },
        include: {
            user: { select: { name: true, avatarUrl: true } },
            booking: { select: { bookingNumber: true } },
        },
    });
}

// Moved to chat.service.ts and notification.service.ts
export const getOrCreateChat = chatService.getOrCreateChat;
export const getChatMessages = chatService.getChatMessages;
export const sendChatMessage = chatService.sendChatMessage;
export const listChats = chatService.listChats;

export const listNotifications = notificationService.listNotifications;
export const markNotificationRead = notificationService.markNotificationRead;
export const markAllNotificationsRead = notificationService.markAllNotificationsRead;
export const updatePushToken = notificationService.updatePushToken;

// ─── Agents ───Live Tracking (Phase 6) ───

/** Agent status grid for the merchant dashboard */
export async function getAgentStatusGrid(userId: string) {
    const profile = await getMerchantProfile(userId);
    return prisma.agent.findMany({
        where: { merchantId: profile.id },
        select: {
            id: true,
            isActive: true,
            status: true,
            lastLocationLat: true,
            lastLocationLng: true,
            lastLocationAt: true,
            user: { select: { name: true, avatarUrl: true } },
            bookings: {
                where: { status: { in: ['AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } },
                select: {
                    id: true,
                    status: true,
                    bookingNumber: true,
                    scheduledAt: true,
                    address: { select: { city: true, line1: true } },
                },
                take: 1,
                orderBy: { scheduledAt: 'asc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** Live GPS locations for all online agents (used by the merchant map view) */
export async function getAgentLiveLocations(userId: string) {
    const profile = await getMerchantProfile(userId);
    const agents = await prisma.agent.findMany({
        where: {
            merchantId: profile.id,
            isActive: true,
            status: { not: 'OFFLINE' },
            lastLocationLat: { not: null },
            lastLocationLng: { not: null },
        },
        select: {
            id: true,
            status: true,
            lastLocationLat: true,
            lastLocationLng: true,
            lastLocationAt: true,
            user: { select: { name: true, avatarUrl: true } },
            bookings: {
                where: { status: { in: ['AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'] } },
                select: { id: true, status: true, bookingNumber: true },
                take: 1,
                orderBy: { scheduledAt: 'asc' },
            },
        },
    });
    return agents;
}

/** Update agent GPS location — called by the agent mobile app */
export async function updateAgentLocation(
    userId: string,
    lat: number,
    lng: number,
) {
    // Find the agent record via user's ID
    const agent = await prisma.agent.findFirst({
        where: { user: { id: userId } },
    });
    if (!agent) throw new BadRequestError('Agent profile not found');

    return prisma.agent.update({
        where: { id: agent.id },
        data: {
            lastLocationLat: lat,
            lastLocationLng: lng,
            lastLocationAt: new Date(),
        },
        select: { id: true, lastLocationLat: true, lastLocationLng: true, lastLocationAt: true },
    });
}

// ─── Helper ───

async function getMerchantProfile(userId: string) {
    const profile = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestError('Merchant profile not found. Complete onboarding first.');
    return profile;
}
