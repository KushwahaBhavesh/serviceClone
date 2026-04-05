import prisma from '../lib/prisma';
import { cacheable, cacheDelete } from '../lib/redis';
import { BadRequestError } from '../middleware/error-handler';
import type { AddressInput, TopupInput } from '../validators/customer.validators';

// ─── Addresses ───

export async function listAddresses(userId: string) {
    return cacheable(`customer:addresses:${userId}`, 300, () =>
        prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        }),
    );
}

export async function createAddress(userId: string, data: AddressInput) {
    if (data.isDefault) {
        await prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const result = await prisma.address.create({
        data: { ...data, userId },
    });
    await cacheDelete(`customer:addresses:${userId}`);
    return result;
}

export async function updateAddress(userId: string, addressId: string, data: Partial<AddressInput>) {
    const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
    });
    if (!address) throw new BadRequestError('Address not found');

    if (data.isDefault) {
        await prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const result = await prisma.address.update({
        where: { id: addressId },
        data,
    });
    await cacheDelete(`customer:addresses:${userId}`);
    return result;
}

export async function deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
    });
    if (!address) throw new BadRequestError('Address not found');

    const result = await prisma.address.delete({
        where: { id: addressId },
    });
    await cacheDelete(`customer:addresses:${userId}`);
    return result;
}

// ─── Wallet ───

export async function getWalletData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
    });

    const transactions = await prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return {
        balance: user?.walletBalance || 0,
        transactions,
    };
}

export async function topupWallet(userId: string, data: TopupInput) {
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.create({
            data: {
                userId,
                amount: data.amount,
                type: 'TOPUP',
                status: 'COMPLETED',
                description: `Wallet top-up via ${data.paymentMethod || 'App'}`,
            },
        });

        const user = await tx.user.update({
            where: { id: userId },
            data: {
                walletBalance: { increment: data.amount },
            },
        });

        return { transaction, newBalance: user.walletBalance };
    });
}

// ─── Reviews ───

export async function listMyReviews(userId: string) {
    return prisma.review.findMany({
        where: { userId },
        include: {
            booking: {
                include: {
                    items: { include: { service: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// ─── Notifications ───

export async function listMyNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        prisma.notification.count({
            where: { userId, readAt: null },
        }),
    ]);
    return { notifications, unreadCount };
}

export async function markAllNotificationsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
    });
}

// ─── Chats ───

export async function listMyChats(userId: string) {
    return prisma.chat.findMany({
        where: {
            participants: { some: { userId } },
        },
        include: {
            booking: {
                include: {
                    items: { include: { service: true } },
                    merchant: { select: { name: true, avatarUrl: true } },
                    agent: { include: { user: { select: { name: true, avatarUrl: true } } } },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
}
