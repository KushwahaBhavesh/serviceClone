import prisma from '../prisma';
import { BadRequestError } from '../errors';

// ─── Dashboard Stats ───

export async function getDashboardStats() {
    const [
        totalUsers,
        totalMerchants,
        totalBookings,
        activeBookings,
        pendingMerchants,
        revenueResult,
        totalAgents,
        recentUsers,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.merchantProfile.count(),
        prisma.booking.count(),
        prisma.booking.count({
            where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED'] } },
        }),
        prisma.merchantProfile.count({ where: { verificationStatus: 'PENDING_REVIEW' } }),
        prisma.booking.aggregate({
            _sum: { total: true },
            where: { paymentStatus: 'PAID' },
        }),
        prisma.agent.count(),
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
    ]);

    return {
        totalUsers,
        totalMerchants,
        totalBookings,
        activeBookings,
        pendingMerchants,
        totalRevenue: revenueResult._sum.total || 0,
        totalAgents,
        recentUsers,
    };
}

// ─── Users ───

export async function listUsers(options: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}) {
    const { search, role, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
        ];
    }

    if (role) {
        where.role = role;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                avatarUrl: true,
                onboardingCompleted: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function updateUserStatus(id: string, status: string) {
    const validStatuses = ['ACTIVE', 'DEACTIVATED', 'SUSPENDED', 'PENDING_VERIFICATION'];
    if (!validStatuses.includes(status)) {
        throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return prisma.user.update({
        where: { id },
        data: { status: status as any },
    });
}

export async function updateUserRole(id: string, role: string) {
    const validRoles = ['CUSTOMER', 'MERCHANT', 'AGENT', 'ADMIN'];
    if (!validRoles.includes(role)) {
        throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    return prisma.user.update({
        where: { id },
        data: { role: role as any },
    });
}

export async function deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
}

// ─── Merchants / KYC ───

export async function listMerchants(options: {
    status?: string;
    page?: number;
    limit?: number;
}) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
        where.verificationStatus = status;
    }

    const [merchants, total] = await Promise.all([
        prisma.merchantProfile.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, status: true },
                },
                verificationDocs: true,
                _count: {
                    select: {
                        agents: true,
                        merchantServices: true,
                    },
                },
            },
        }),
        prisma.merchantProfile.count({ where }),
    ]);

    return {
        merchants,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function updateMerchantVerification(
    merchantId: string,
    status: string,
    reviewNote?: string,
) {
    const validStatuses = ['NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new BadRequestError(`Invalid verification status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const merchant = await prisma.merchantProfile.update({
        where: { id: merchantId },
        data: {
            verificationStatus: status as any,
            isVerified: status === 'APPROVED',
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });

    // If approved, activate the user account too
    if (status === 'APPROVED') {
        await prisma.user.update({
            where: { id: merchant.userId },
            data: { status: 'ACTIVE' },
        });
    }

    return merchant;
}

// ─── Bookings ───

export async function listBookings(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    const { status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
        where.status = status as any;
    }

    if (search) {
        where.OR = [
            { bookingNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true, email: true } },
                merchant: { select: { id: true, name: true } },
                items: {
                    include: {
                        service: { select: { name: true, basePrice: true } },
                    },
                },
                address: { select: { line1: true, city: true } },
                agent: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.booking.count({ where }),
    ]);

    return {
        bookings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// ─── Catalog: Categories ───

export async function listCategories() {
    const categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
            _count: { select: { services: true } },
            children: {
                select: { id: true, name: true, slug: true },
            },
        },
    });

    return categories;
}

export async function createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    imageUrl?: string;
    parentId?: string;
    sortOrder?: number;
}) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) {
        throw new BadRequestError(`Category with slug "${data.slug}" already exists`);
    }

    return prisma.category.create({ data });
}

export async function updateCategory(
    id: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
        iconUrl?: string;
        imageUrl?: string;
        isActive?: boolean;
        sortOrder?: number;
    },
) {
    return prisma.category.update({ where: { id }, data });
}

// ─── Catalog: Services ───

export async function listServices(categoryId?: string) {
    const where: any = {};
    if (categoryId) {
        where.categoryId = categoryId;
    }

    return prisma.service.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
            category: { select: { id: true, name: true } },
            _count: { select: { merchantServices: true } },
        },
    });
}

export async function createService(data: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    basePrice: number;
    unit?: string;
    duration?: number;
    categoryId: string;
}) {
    const existing = await prisma.service.findUnique({ where: { slug: data.slug } });
    if (existing) {
        throw new BadRequestError(`Service with slug "${data.slug}" already exists`);
    }

    return prisma.service.create({ data });
}

export async function updateService(
    id: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
        imageUrl?: string;
        basePrice?: number;
        unit?: string;
        duration?: number;
        isActive?: boolean;
    },
) {
    return prisma.service.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
    // Check for child services first 
    const count = await prisma.service.count({ where: { categoryId: id } });
    if (count > 0) {
        throw new BadRequestError(`Cannot delete category with ${count} active services. Move or delete them first.`);
    }
    return prisma.category.delete({ where: { id } });
}

export async function deleteService(id: string) {
    return prisma.service.delete({ where: { id } });
}
