import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';

export async function listNotifications(
    userId: string,
    options: { unreadOnly?: boolean; page?: number; limit?: number } = {},
) {
    const { unreadOnly = false, page = 1, limit = 30 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) where.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
        notifications,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

export async function markNotificationRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
        where: { id, userId },
    });
    if (!notification) throw new BadRequestError('Notification not found');

    return prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
    });
}

export async function markAllNotificationsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
    });
}

export async function updatePushToken(userId: string, token: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { pushToken: token },
    });
}
