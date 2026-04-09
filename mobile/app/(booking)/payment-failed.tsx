import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import {
    XCircle,
    RefreshCcw,
    Headphones,
    LayoutList,
    ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../constants/theme';
import { paymentApi } from '../../lib/marketplace';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

export default function PaymentFailedScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showError } = useToast();
    const { bookingId, errorCode, errorDescription } = useLocalSearchParams<{
        bookingId: string;
        errorCode: string;
        errorDescription: string;
    }>();

    const pulseValue = useSharedValue(1);

    React.useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: interpolate(pulseValue.value, [1, 1.1], [0.8, 0.3], Extrapolate.CLAMP),
    }));

    const handleRetry = async () => {
        if (!bookingId) {
            showError('Cannot retry — booking information missing.');
            return;
        }
        try {
            const payRes = await paymentApi.initiate({ bookingId, method: 'RAZORPAY' });
            if (payRes.data.gatewayConfig) {
                const config = payRes.data.gatewayConfig;
                const RazorpayCheckout = (await import('react-native-razorpay')).default;
                const sdkResult = await RazorpayCheckout.open({
                    key: config.key,
                    amount: config.amount,
                    currency: config.currency,
                    name: config.name,
                    description: config.description,
                    order_id: config.orderId,
                    theme: { color: '#FF5722' },
                });

                await paymentApi.confirm({
                    transactionId: payRes.data.transactionId,
                    razorpay_payment_id: sdkResult.razorpay_payment_id,
                    razorpay_order_id: sdkResult.razorpay_order_id,
                    razorpay_signature: sdkResult.razorpay_signature,
                });

                router.replace('/(booking)/confirmation');
            }
        } catch (err: any) {
            showError(err?.description || err?.message || 'Payment failed again. Please try later.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                {/* Failure Header */}
                <View style={styles.celebrationWrap}>
                    <Animated.View style={[styles.pulseRing, pulseStyle]} />
                    <Animated.View entering={FadeInUp.springify()} style={styles.iconBox}>
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.iconGradient}
                        >
                            <XCircle size={48} color="#FFF" strokeWidth={2.5} />
                        </LinearGradient>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.textWrap}>
                    <Text style={styles.title}>PAYMENT FAILED</Text>
                    <Text style={styles.subtitle}>
                        {errorDescription || 'Your payment could not be processed. No amount has been deducted from your account.'}
                    </Text>
                    {errorCode && errorCode !== 'PAYMENT_FAILED' && (
                        <View style={styles.errorCodeBox}>
                            <Text style={styles.errorCodeText}>CODE: {errorCode}</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Info Bento */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.bentoContainer}>
                    <View style={styles.bentoItem}>
                        <View style={styles.bentoIcon}><RefreshCcw size={18} color={Colors.primary} /></View>
                        <View style={styles.bentoInfo}>
                            <Text style={styles.bentoTitle}>NO AMOUNT DEDUCTED</Text>
                            <Text style={styles.bentoSub}>If any amount was held, it will be auto-refunded within 5–7 business days.</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Bottom Actions */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.bottomContent}>
                    <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.replace('/(tabs)/bookings');
                        }}
                    >
                        <View style={styles.secBtnContent}>
                            <LayoutList size={20} color="#111" />
                            <Text style={styles.secBtnText}>BOOKINGS</Text>
                        </View>
                    </Pressable>
                    <Pressable
                        style={styles.supportBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            // Navigate to support or open mailto
                            router.push('/(customer)/support' as any);
                        }}
                    >
                        <View style={styles.secBtnContent}>
                            <Headphones size={20} color="#111" />
                            <Text style={styles.secBtnText}>SUPPORT</Text>
                        </View>
                    </Pressable>
                    <Pressable
                        style={styles.mainCta}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            handleRetry();
                        }}
                    >
                        <View style={styles.ctaInner}>
                            <Text style={styles.ctaText}>RETRY</Text>
                            <ChevronRight size={18} color="#FFF" strokeWidth={3.5} />
                        </View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 35 },

    // Celebration (reused pattern from confirmation)
    celebrationWrap: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#EF4444', opacity: 0.1 },
    iconBox: { width: 110, height: 110, borderRadius: 45, overflow: 'hidden', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
    iconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    textWrap: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: 1.5, marginBottom: 15 },
    subtitle: { fontSize: 13, fontWeight: '600', color: '#AAA', textAlign: 'center', lineHeight: 22 },
    errorCodeBox: { marginTop: 12, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    errorCodeText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 1 },

    // Bento
    bentoContainer: { width: '100%', gap: 15 },
    bentoItem: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#FAFAFA', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#F0F0F0' },
    bentoIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    bentoInfo: { flex: 1 },
    bentoTitle: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1 },
    bentoSub: { fontSize: 11, fontWeight: '600', color: '#AAA', marginTop: 4 },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    bottomContent: { flexDirection: 'row', padding: 20, gap: 12 },
    secondaryBtn: { width: 70, height: 60, borderRadius: 20, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    supportBtn: { width: 70, height: 60, borderRadius: 20, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    secBtnContent: { alignItems: 'center', gap: 4 },
    secBtnText: { fontSize: 8, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
    mainCta: { flex: 1, height: 60, borderRadius: 20, backgroundColor: Colors.primary, overflow: 'hidden' },
    ctaInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    ctaText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
});
