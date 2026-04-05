import prisma from '../lib/prisma';
import { cacheDelete } from '../lib/redis';
import { BadRequestError, UnauthorizedError } from '../middleware/error-handler';
import { createNotification } from './push.service';

import type {
    CreateBookingInput,
    UpdateBookingStatusInput,
    CreateReviewInput,
} from '../validators/marketplace.validators';

// ─── Helpers ───

type BookingStatusType =
    | 'PENDING' | 'ACCEPTED' | 'AGENT_ASSIGNED' | 'EN_ROUTE'
    | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

const VALID_TRANSITIONS: Record<BookingStatusType, BookingStatusType[]> = {
    PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['AGENT_ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
    AGENT_ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
    EN_ROUTE: ['ARRIVED'],
    ARRIVED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
};

function generateBookingNumber(): string {
    const prefix = 'SIQ';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// ─── Bookings ───

export async function createBooking(customerId: string, data: CreateBookingInput) {
    const address = await prisma.address.findFirst({
        where: { id: data.addressId, userId: customerId },
    });
    if (!address) throw new BadRequestError('Invalid address');

    const serviceIds = data.items.map((i: { serviceId: string }) => i.serviceId);
    const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
    });
    if (services.length !== serviceIds.length) {
        throw new BadRequestError('One or more selected services are unavailable');
    }

    // Auto-resolve merchantId: find the best merchant offering the first service
    let resolvedMerchantId: string | null = (data as any).merchantId || null;

    if (!resolvedMerchantId) {
        // Find a verified merchant who offers the primary service, preferring closest/highest-rated
        const merchantService = await prisma.merchantService.findFirst({
            where: {
                serviceId: serviceIds[0],
                isActive: true,
                merchant: { isVerified: true },
            },
            include: {
                merchant: { select: { userId: true, rating: true } },
            },
            orderBy: { merchant: { rating: 'desc' } },
        });

        if (merchantService) {
            resolvedMerchantId = merchantService.merchant.userId;
        }
    }

    const priceMap = new Map<string, number>(services.map(s => [s.id, s.basePrice]));
    let subtotal = 0;
    const itemsData = data.items.map((item: { serviceId: string; quantity: number; notes?: string }) => {
        const price = priceMap.get(item.serviceId) || 0;
        subtotal += price * item.quantity;
        return {
            serviceId: item.serviceId,
            quantity: item.quantity,
            price,
            notes: item.notes,
        };
    });

    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const booking = await prisma.booking.create({
        data: {
            bookingNumber: generateBookingNumber(),
            customerId,
            merchantId: resolvedMerchantId,
            addressId: data.addressId,
            scheduledAt: new Date(data.scheduledAt),
            notes: data.notes,
            subtotal,
            tax,
            total,
            items: { create: itemsData },
        },
        include: {
            items: { include: { service: true } },
            address: true,
        },
    });

    // Invalidate merchant dashboard cache
    if (resolvedMerchantId) {
        await cacheDelete(`merchant:dash:${resolvedMerchantId}`);
    }

    return booking;
}

export async function listBookings(
    userId: string,
    role: 'customer' | 'merchant',
    options: { status?: BookingStatusType; page?: number; limit?: number },
) {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = role === 'customer'
        ? { customerId: userId }
        : { merchantId: userId };
    if (status) {
        const statuses = (status as string).split(',').map(s => s.trim());
        where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                items: { include: { service: { select: { id: true, name: true, imageUrl: true } } } },
                address: { select: { label: true, line1: true, city: true } },
                customer: { select: { id: true, name: true, avatarUrl: true } },
                merchant: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { scheduledAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.booking.count({ where }),
    ]);

    return {
        bookings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}

export async function getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            items: { include: { service: true } },
            address: true,
            customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
            merchant: { select: { id: true, name: true, avatarUrl: true, phone: true } },
            review: true,
        },
    });

    if (!booking) throw new BadRequestError('Booking not found');
    if (booking.customerId !== userId && booking.merchantId !== userId) {
        throw new UnauthorizedError('Not authorized to view this booking');
    }

    return booking;
}

export async function updateBookingStatus(
    bookingId: string,
    userId: string,
    data: UpdateBookingStatusInput,
) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BadRequestError('Booking not found');

    const isCustomer = booking.customerId === userId;
    const isMerchant = booking.merchantId === userId;

    if (!isCustomer && !isMerchant) {
        throw new UnauthorizedError('Not authorized');
    }

    if (isCustomer && data.status !== 'CANCELLED') {
        throw new UnauthorizedError('Customers can only cancel bookings');
    }

    const allowed = VALID_TRANSITIONS[booking.status as BookingStatusType];
    if (!allowed || !allowed.includes(data.status as BookingStatusType)) {
        throw new BadRequestError(
            `Cannot transition from ${booking.status} to ${data.status}`,
        );
    }

    const updateData: Record<string, unknown> = { status: data.status as BookingStatusType };
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    if (data.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = data.cancellationReason;
    }

    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
            items: { include: { service: true } },
            address: true,
        },
    });

    // Notify customer when merchant updates the status
    if (isMerchant && data.status) {
        await createNotification(
            updatedBooking.customerId,
            'BOOKING' as any,
            'Booking Update',
            `Your booking #${updatedBooking.bookingNumber} is now ${data.status.replace('_', ' ')}.`,
        );
    }

    // Invalidate merchant dashboard cache
    if (booking.merchantId) {
        await cacheDelete(`merchant:dash:${booking.merchantId}`);
    }

    return updatedBooking;
}

// ─── Reviews ───

export async function createReview(userId: string, data: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { review: true },
    });

    if (!booking) throw new BadRequestError('Booking not found');
    if (booking.customerId !== userId) throw new UnauthorizedError('Only customer can review');
    if (booking.status !== 'COMPLETED') throw new BadRequestError('Can only review completed bookings');
    if (booking.review) throw new BadRequestError('Review already exists for this booking');

    return prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: {
                bookingId: data.bookingId,
                userId,
                rating: data.rating,
                comment: data.comment,
                imageUrls: data.imageUrls || [],
            },
        });

        // Update merchant aggregate metrics
        if (booking.merchantId) {
            const merchant = await tx.merchantProfile.findUnique({
                where: { userId: booking.merchantId },
            });

            if (merchant) {
                const totalReviews = merchant.totalReviews + 1;
                const rating = (merchant.rating * merchant.totalReviews + data.rating) / totalReviews;

                await tx.merchantProfile.update({
                    where: { userId: booking.merchantId },
                    data: { rating, totalReviews },
                });
            }
        }

        return review;
    });
}
