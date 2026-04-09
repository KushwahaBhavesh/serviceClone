import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

// Lazy import to avoid crashes when expo-notifications isn't installed yet
let Notifications: any;
try {
    Notifications = require('expo-notifications');
} catch {
    Notifications = null;
}

/**
 * Global notification handler — handles foreground display and tap deep-linking.
 * Should be called ONCE in the root _layout.tsx.
 */

// Configure foreground notification behavior (if available)
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// Deep-link mapping from notification data to app routes
function resolveDeepLink(screen: string, data: Record<string, any>): string | null {
    if (!screen) return null;

    // If the screen is already a valid route path, use it directly
    if (screen.startsWith('/') || screen.startsWith('(')) {
        return screen;
    }

    // Named deep-link mapping
    switch (screen) {
        case 'booking_detail':
            return data.bookingId ? `/(customer)/orders/${data.bookingId}` : null;
        case 'job_detail':
            return data.bookingId ? `/(agent)/jobs/${data.bookingId}` : null;
        case 'chat':
            return data.chatId ? `/chat/${data.chatId}` : null;
        default:
            return null;
    }
}

export default function useNotificationHandler() {
    const router = useRouter();
    const responseListener = useRef<any>(null);
    const receivedListener = useRef<any>(null);

    useEffect(() => {
        if (!Notifications) return;

        // Foreground: notification received while app is open
        receivedListener.current = Notifications.addNotificationReceivedListener(
            (notification: any) => {
                console.log('[Notification] Received in foreground:', notification.request.content.title);
            },
        );

        // Tap: user tapped on a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response: any) => {
                const data = response.notification.request.content.data as Record<string, any>;

                const screenField = data?.deepLink || data?.screen;
                if (screenField) {
                    const route = resolveDeepLink(screenField, data);
                    if (route) {
                        try {
                            router.push(route as any);
                        } catch (e) {
                            console.warn('[Notification] Deep link navigation failed:', e);
                        }
                    }
                }
            },
        );

        return () => {
            if (receivedListener.current) {
                Notifications.removeNotificationSubscription(receivedListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [router]);
}
