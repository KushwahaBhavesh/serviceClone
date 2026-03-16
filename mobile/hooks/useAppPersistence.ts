import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Re-validate session if app was in background for more than 5 minutes
const REVALIDATE_INTERVAL = 5 * 60 * 1000;

export function useAppPersistence() {
    const { initialize, isAuthenticated } = useAuthStore();
    const appState = useRef(AppState.currentState);
    const lastBackgroundTime = useRef<number | null>(null);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground
                const now = Date.now();
                if (
                    isAuthenticated &&
                    lastBackgroundTime.current &&
                    now - lastBackgroundTime.current > REVALIDATE_INTERVAL
                ) {
                    console.log('App returned to foreground after interval, re-validating session...');
                    initialize();
                }
            }

            if (nextAppState.match(/inactive|background/)) {
                lastBackgroundTime.current = Date.now();
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, initialize]);
}
