import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';

import type {
    CreateCategoryInput,
    UpdateCategoryInput,
    CreateServiceInput,
    UpdateServiceInput,
    GetNearbyMerchantsInput,
} from '../validators/marketplace.validators';

// ─── Helpers ───

// Haversine formula to calculate distance between two coordinates in kilometers.
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─── Categories ───

export async function listCategories(parentId?: string) {
    return prisma.category.findMany({
        where: {
            isActive: true,
            parentId: parentId ?? null,
        },
        include: {
            children: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            },
            _count: { select: { services: true } },
        },
        orderBy: { sortOrder: 'asc' },
    });
}

export async function getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            services: { where: { isActive: true }, orderBy: { name: 'asc' } },
        },
    });
    if (!category) throw new BadRequestError('Category not found');
    return category;
}

export async function createCategory(data: CreateCategoryInput) {
    return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
    return prisma.category.update({ where: { id }, data: { isActive: false } });
}

// ─── Services ───

export async function listServices(options: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'name';
}) {
    const { categoryId, search, page = 1, limit = 20, sortBy } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    let orderBy: Record<string, string> = { name: 'asc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };

    const [services, total] = await Promise.all([
        prisma.service.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                merchantServices: {
                    where: {
                        isActive: true,
                        merchant: { isVerified: true }
                    },
                    include: {
                        merchant: {
                            select: {
                                id: true, businessName: true, rating: true,
                                totalReviews: true, isVerified: true, logoUrl: true,
                            },
                        },
                    },
                    take: 3,
                },
                _count: { select: { merchantServices: true } },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma.service.count({ where }),
    ]);

    return {
        services,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}

export async function getServiceBySlug(slug: string) {
    const service = await prisma.service.findUnique({
        where: { slug },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            merchantServices: {
                where: {
                    isActive: true,
                    merchant: { isVerified: true }
                },
                include: {
                    merchant: {
                        select: {
                            id: true, businessName: true, rating: true,
                            totalReviews: true, isVerified: true, logoUrl: true,
                            city: true,
                        },
                    },
                },
            },
        },
    });
    if (!service) throw new BadRequestError('Service not found');
    return service;
}

export async function getAvailableSlots(serviceId: string, date: string) {
    // Find merchants that offer this service AND are verified
    const merchantServices = await prisma.merchantService.findMany({
        where: {
            serviceId,
            isActive: true,
            merchant: { isVerified: true }
        },
        select: { merchantId: true, price: true },
    });

    if (merchantServices.length === 0) return { slots: [] };

    const merchantIds = merchantServices.map(ms => ms.merchantId);
    const targetDate = new Date(date);

    const slots = await prisma.slot.findMany({
        where: {
            merchantId: { in: merchantIds },
            date: targetDate,
            isBooked: false,
        },
        include: {
            agent: {
                include: { user: { select: { name: true, avatarUrl: true } } },
            },
            merchant: {
                select: { id: true, businessName: true, rating: true, logoUrl: true },
            },
        },
        orderBy: [{ startTime: 'asc' }],
    });

    return { slots, date };
}

// ─── Promo Code Validation ───

export async function validatePromoCode(code: string, orderTotal: number) {
    const promo = await prisma.promotion.findUnique({
        where: { code },
    });

    if (!promo) throw new BadRequestError('Invalid promo code');
    if (!promo.isActive) throw new BadRequestError('Promo code is no longer active');
    if (new Date() > promo.expiryDate) throw new BadRequestError('Promo code has expired');
    if (promo.usageLimit && promo.currentUsage >= promo.usageLimit) {
        throw new BadRequestError('Promo code usage limit reached');
    }
    if (promo.minOrderValue && orderTotal < promo.minOrderValue) {
        throw new BadRequestError(`Minimum order of ₹${promo.minOrderValue} required`);
    }

    let discount = 0;
    if (promo.type === 'PERCENTAGE') {
        discount = Math.round(orderTotal * (promo.value / 100) * 100) / 100;
        if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
        }
    } else {
        discount = promo.value;
    }

    return {
        valid: true,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discount,
        message: promo.type === 'PERCENTAGE'
            ? `${promo.value}% off applied! You save ₹${discount}`
            : `₹${discount} flat discount applied!`,
    };
}

// ─── Service Reviews (Public) ───

export async function getServiceReviews(serviceId: string, options: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total, avg] = await Promise.all([
        prisma.review.findMany({
            where: { booking: { items: { some: { serviceId } } } },
            include: {
                user: { select: { name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.review.count({
            where: { booking: { items: { some: { serviceId } } } },
        }),
        prisma.review.aggregate({
            where: { booking: { items: { some: { serviceId } } } },
            _avg: { rating: true },
        }),
    ]);

    return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        avgRating: avg._avg.rating || 0,
    };
}

export async function createService(data: CreateServiceInput) {
    return prisma.service.create({ data });
}

export async function updateService(id: string, data: UpdateServiceInput) {
    return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
    return prisma.service.update({ where: { id }, data: { isActive: false } });
}

// ─── Merchant Profile (Customer-facing) ───

export async function getMerchantProfileById(merchantId: string) {
    const merchant = await prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        include: {
            user: { select: { name: true, avatarUrl: true, phone: true } },
            merchantServices: {
                where: { isActive: true },
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                            imageUrl: true,
                            basePrice: true,
                            unit: true,
                            duration: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        },
    });

    if (!merchant || !merchant.isVerified) {
        throw new BadRequestError('Service provider not found');
    }

    // Fetch recent reviews for this merchant's bookings
    const reviews = await prisma.review.findMany({
        where: {
            booking: { merchantId: merchant.userId },
        },
        include: {
            user: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return {
        id: merchant.id,
        businessName: merchant.businessName,
        businessCategory: merchant.businessCategory,
        description: merchant.description,
        logoUrl: merchant.logoUrl,
        coverImageUrl: merchant.coverImageUrl,
        phone: merchant.phone,
        address: merchant.address,
        city: merchant.city,
        state: merchant.state,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        serviceRadius: merchant.serviceRadius,
        rating: merchant.rating,
        totalReviews: merchant.totalReviews,
        isVerified: merchant.isVerified,
        owner: merchant.user,
        services: merchant.merchantServices.map((ms) => ({
            merchantServiceId: ms.id,
            price: ms.price,
            ...ms.service,
        })),
        reviews: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            user: r.user,
        })),
    };
}

// ─── Nearby Providers ───

export async function getNearbyMerchants({
    latitude,
    longitude,
    radius = 50,
    categoryId,
    limit = 20,
}: GetNearbyMerchantsInput) {
    // 1. Fetch all verified merchants (or filter by category if provided)
    const merchants = await prisma.merchantProfile.findMany({
        where: {
            isVerified: true,
            latitude: { not: null },
            longitude: { not: null },
            ...(categoryId
                ? { merchantServices: { some: { service: { categoryId } } } }
                : {}),
        },
        include: {
            user: { select: { name: true, avatarUrl: true } },
            merchantServices: {
                where: { isActive: true },
                include: { service: { select: { name: true, category: { select: { name: true } } } } },
                take: 3,
            },
        },
    });

    // 2. Calculate distance and filter by radius
    const nearbyMerchants = merchants
        .map((merchant) => {
            const distance = calculateDistance(
                latitude,
                longitude,
                merchant.latitude!,
                merchant.longitude!
            );
            return { ...merchant, distance };
        })
        .filter((merchant) => merchant.distance <= radius)
        .sort((a, b) => {
            // Sort by Elite first, then distance, then rating
            // Assuming we check subscription or just use rating + distance for now.
            // For MVP: Distance primary sort, rating secondary.
            if (Math.abs(a.distance - b.distance) < 5) {
                return b.rating - a.rating; // If within 5km, higher rating first
            }
            return a.distance - b.distance;
        })
        .slice(0, limit);

    return nearbyMerchants;
}

// ─── Nearby Promotions ───
export async function getNearbyPromotions({
    latitude,
    longitude,
    limit = 5,
}: {
    latitude: number;
    longitude: number;
    limit?: number;
}) {
    // 1. Fetch all active promotions with merchant location
    const promotions = await prisma.promotion.findMany({
        where: {
            isActive: true,
            expiryDate: { gt: new Date() },
            merchant: {
                isVerified: true,
                latitude: { not: null },
                longitude: { not: null },
            },
        },
        include: {
            merchant: {
                select: {
                    id: true,
                    businessName: true,
                    latitude: true,
                    longitude: true,
                    serviceRadius: true,
                    logoUrl: true,
                },
            },
        },
    });

    // 2. Filter by service radius
    const nearbyPromotions = promotions
        .map((promo) => {
            const distance = calculateDistance(
                latitude,
                longitude,
                promo.merchant.latitude!,
                promo.merchant.longitude!
            );
            return { ...promo, distance };
        })
        .filter((promo) => promo.distance <= promo.merchant.serviceRadius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

    return nearbyPromotions;
}
