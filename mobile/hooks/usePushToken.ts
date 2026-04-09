import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import api from '../lib/api';

// Lazy imports to avoid crashes when packages aren't installed yet
let Notifications: any;
let Device: any;
let Constants: any;
try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Constants = require('expo-constants');
} catch {
    Notifications = null;
}

/**
 * Hook to register Expo push token for the current user.
 * Call in each role layout — it'll register the token with the
 * role-appropriate endpoint.
 *
 * @param role - 'customer' | 'merchant' | 'agent'
 */
export default function usePushToken(role: 'customer' | 'merchant' | 'agent') {
    const lastTokenRef = useRef<string | null>(null);

    useEffect(() => {
        registerPushToken();

        // Re-register on app resume (handles token rotation)
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                registerPushToken();
            }
        });

        return () => subscription.remove();
    }, [role]);

    async function registerPushToken() {
        try {
            if (!Notifications || !Device) return;

            // Push only works on physical devices
            if (!Device.isDevice) {
                console.log('[Push] Skipping — not a physical device');
                return;
            }

            // Request permission
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('[Push] Permission denied');
                return;
            }

            // Get Expo push token
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            const token = tokenData.data;

            // Skip if token hasn't changed
            if (token === lastTokenRef.current) return;
            lastTokenRef.current = token;

            // Register with appropriate API endpoint
            const endpoint = `/${role}/push-token`;
            await api.post(endpoint, { token });

            console.log(`[Push] Token registered for ${role}: ${token.slice(0, 20)}...`);

            // Android: set notification channel
            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6B35',
                });
            }
        } catch (error) {
            // Silent failure — will retry on next app resume
            console.warn('[Push] Token registration failed:', error);
        }
    }
}
