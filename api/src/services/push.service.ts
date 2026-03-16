import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

const expo = new Expo();

export async function createNotification(userId: string, type: any, title: string, body: string, deepLink?: string) {
    const notif = await prisma.notification.create({
        data: {
            userId,
            type,
            title,
            body,
            deepLink,
        }
    });

    // Fire-and-forget push
    sendPushNotification(userId, title, body, { deepLink, type }).catch(err => logger.error('Push error hook: %O', err));

    return notif;
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true },
        });

        if (!user || !user.pushToken) {
            logger.info('Push skipped: No token for user %s', userId);
            return false;
        }

        if (!Expo.isExpoPushToken(user.pushToken)) {
            logger.error('Invalid push token for user %s: %s', userId, user.pushToken);
            return false;
        }

        const messages: ExpoPushMessage[] = [{
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data: data || {},
        }];

        const chunks = expo.chunkPushNotifications(messages);

        for (let chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
                logger.info('Push sent successfully to user %s', userId);
            } catch (error) {
                logger.error('Push chunk error: %O', error);
            }
        }

        return true;
    } catch (error) {
        logger.error('Failed to send push notification to user %s: %O', userId, error);
        return false;
    }
}
