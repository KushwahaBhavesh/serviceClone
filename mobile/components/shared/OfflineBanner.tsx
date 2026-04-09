import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Lazy import to avoid crash if not installed
let NetInfo: any;
try {
    NetInfo = require('@react-native-community/netinfo');
} catch {
    NetInfo = null;
}

type BannerState = 'hidden' | 'offline' | 'back-online';

export default function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<BannerState>('hidden');
    const slideAnim = useRef(new Animated.Value(-60)).current;
    const wasOfflineRef = useRef(false);
    const mountTimeRef = useRef(Date.now());

    useEffect(() => {
        if (!NetInfo) return;

        const unsubscribe = NetInfo.addEventListener((netState: any) => {
            const isConnected = netState.isConnected && netState.isInternetReachable !== false;

            // 1s debounce on startup to prevent flash
            const msSinceMount = Date.now() - mountTimeRef.current;
            if (msSinceMount < 1000 && !isConnected) {
                // Wait a bit before showing offline
                setTimeout(() => {
                    NetInfo.fetch().then((s: any) => {
                        if (!s.isConnected || s.isInternetReachable === false) {
                            showBanner('offline');
                            wasOfflineRef.current = true;
                        }
                    });
                }, 1000);
                return;
            }

            if (!isConnected) {
                showBanner('offline');
                wasOfflineRef.current = true;
            } else if (wasOfflineRef.current) {
                // Was offline, now back online
                showBanner('back-online');
                wasOfflineRef.current = false;
                setTimeout(() => hideBanner(), 2000);
            } else {
                hideBanner();
            }
        });

        return () => unsubscribe();
    }, []);

    function showBanner(newState: BannerState) {
        setState(newState);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    }

    function hideBanner() {
        Animated.timing(slideAnim, {
            toValue: -60,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setState('hidden'));
    }

    if (state === 'hidden') return null;

    const isOffline = state === 'offline';

    return (
        <Animated.View
            style={[
                styles.banner,
                {
                    backgroundColor: isOffline ? '#EF4444' : '#10B981',
                    paddingTop: insets.top + 4,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Ionicons
                name={isOffline ? 'cloud-offline' : 'cloud-done'}
                size={16}
                color="#FFF"
            />
            <Text style={styles.text}>
                {isOffline ? 'No internet connection' : 'Back online'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 8,
        gap: 6,
    },
    text: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
});
