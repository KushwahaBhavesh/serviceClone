import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';

import type {
    CreateCategoryInput,
    UpdateCategoryInput,
    CreateServiceInput,
    UpdateServiceInput,
} from '../validators/marketplace.validators';

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
                    where: { isActive: true },
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
                where: { isActive: true },
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

// ─── Slot Availability (Customer-facing) ───

export async function getAvailableSlots(serviceId: string, date: string) {
    // Find merchants that offer this service
    const merchantServices = await prisma.merchantService.findMany({
        where: { serviceId, isActive: true },
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
