import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    useSharedValue,
    interpolateColor
} from 'react-native-reanimated';
import { 
    Check, 
    Zap, 
    Shield, 
    Star, 
    ChevronRight, 
    X,
    LayoutDashboard,
    Users,
    HardHat
} from 'lucide-react-native';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

// ─── Constants ───
const DARK_SLATE = '#0F172A';
const ELECTRIC_ORANGE = '#FF6B00';
const GLASS_WHITE = 'rgba(255, 255, 255, 0.08)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.12)';

const PLANS = [
    {
        id: 'STARTER',
        name: 'Basic',
        price: 'Free',
        period: '/ forever',
        description: 'Perfect for independent professionals getting started.',
        features: ['1 Business Profile', 'Manage 2 Agents', 'Basic Analytics', 'Standard Support'],
        icon: HardHat,
        color: '#94A3B8',
        isPopular: false,
    },
    {
        id: 'PRO',
        name: 'Professional',
        price: '₹1,499',
        period: '/ month',
        description: 'Everything you need to grow your service empire.',
        features: ['Premium Profile', 'Manage 10 Agents', 'Advanced Revenue Insights', 'Priority Chat Support', 'Service Radius Boost'],
        icon: Zap,
        color: ELECTRIC_ORANGE,
        isPopular: true,
    },
    {
        id: 'ELITE',
        name: 'Enterprise',
        price: '₹4,999',
        period: '/ month',
        description: 'Advanced tools for large multi-city companies.',
        features: ['Unlimited Agents', 'Multi-location Management', 'White-labeled Reports', 'Dedicated Account Manager', 'Custom API Access'],
        icon: Star,
        color: '#A855F7',
        isPopular: false,
    },
];

export default function PricingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { completeOnboarding, isLoading } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ELITE'>('PRO');

    // ─── Logic ───
    const handleComplete = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 1. Data Sanitization (Fixing the Onboarding Failed issue)
            const cleanStr = (val: string | string[] | undefined) => {
                if (!val || val === 'null' || val === 'undefined') return undefined;
                return Array.isArray(val) ? val[0] : val;
            };

            const latStr = cleanStr(params.latitude);
            const lngStr = cleanStr(params.longitude);
            
            const latitude = latStr ? parseFloat(latStr) : undefined;
            const longitude = lngStr ? parseFloat(lngStr) : undefined;

            // Strict validation before sending to backend
            if (latStr && isNaN(latitude!)) throw new Error("Invalid latitude format");
            if (lngStr && isNaN(longitude!)) throw new Error("Invalid longitude format");

            await completeOnboarding({
                role: (cleanStr(params.role) as any) || 'MERCHANT',
                email: cleanStr(params.email),
                businessName: cleanStr(params.businessName),
                businessCategory: cleanStr(params.businessCategory),
                locationName: cleanStr(params.locationName),
                latitude,
                longitude,
                selectedPlan
            });
            
            // Note: Navigation is handled by AuthGate in _layout.tsx
        } catch (error: any) {
            console.error('Onboarding Error:', error);
            Alert.alert(
                'Onboarding Failed', 
                error.message || 'We could not complete your registration. Please check your connection and try again.'
            );
        }
    };

    const handleSelectPlan = (id: 'STARTER' | 'PRO' | 'ELITE') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedPlan(id);
    };

    // ─── Render ───
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <LinearGradient
                colors={[DARK_SLATE, '#1E293B']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 120 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                    <View style={styles.header}>
                        <View style={styles.badge}>
                            <Zap size={12} color={ELECTRIC_ORANGE} fill={ELECTRIC_ORANGE} />
                            <Text style={styles.badgeText}>PARTNER PROGRAM</Text>
                        </View>
                        <Text style={styles.title}>Power up your business</Text>
                        <Text style={styles.subtitle}>
                            Select a plan that fits your current needs. {'\n'}
                            You can always change this later.
                        </Text>
                    </View>
                </Animated.View>

                {/* Pricing Cards */}
                <View style={styles.planContainer}>
                    {PLANS.map((plan, index) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <Animated.View 
                                key={plan.id}
                                entering={FadeInUp.delay(400 + index * 100).duration(600)}
                            >
                                <Pressable
                                    onPress={() => handleSelectPlan(plan.id as any)}
                                    style={[
                                        styles.planCard,
                                        isSelected && { borderColor: plan.color, backgroundColor: 'rgba(255,255,255,0.05)' }
                                    ]}
                                >
                                    {plan.isPopular && (
                                        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                                            <Text style={styles.popularText}>MOST POPULAR</Text>
                                        </View>
                                    )}

                                    <View style={styles.planHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: plan.color + '20' }]}>
                                            <plan.icon size={24} color={plan.color} strokeWidth={2.5} />
                                        </View>
                                        <View style={styles.nameBox}>
                                            <Text style={styles.planName}>{plan.name}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.planPrice}>{plan.price}</Text>
                                                <Text style={styles.planPeriod}>{plan.period}</Text>
                                            </View>
                                        </View>
                                        <View style={[
                                            styles.radio,
                                            isSelected && { borderColor: plan.color, backgroundColor: plan.color }
                                        ]}>
                                            {isSelected && <Check size={14} color="#FFF" strokeWidth={4} />}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.planDesc}>{plan.description}</Text>

                                    <View style={styles.featureList}>
                                        {plan.features.map((feature, fIdx) => (
                                            <View key={fIdx} style={styles.featureItem}>
                                                <View style={styles.checkIcon}>
                                                    <Check size={14} color={plan.color} strokeWidth={3} />
                                                </View>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Trust Indicators */}
                <Animated.View entering={FadeInUp.delay(1000)} style={styles.trustSection}>
                    <View style={styles.trustItem}>
                        <Shield size={20} color="#94A3B8" />
                        <Text style={styles.trustText}>Secure payments by Razorpay</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Star size={20} color="#94A3B8" />
                        <Text style={styles.trustText}>Cancel or switch plans anytime</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0)', DARK_SLATE]}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                
                <Animated.View entering={FadeInUp.delay(1200)} style={styles.actionContainer}>
                    <Pressable
                        onPress={handleComplete}
                        disabled={isLoading}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && { transform: [{ scale: 0.98 }] },
                            isLoading && styles.btnDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={[ELECTRIC_ORANGE, '#E66100']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.btnText}>Complete Onboarding</Text>
                                    <View style={styles.btnIcon}>
                                        <ChevronRight size={20} color="#FFF" strokeWidth={3} />
                                    </View>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_SLATE,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 0, 0.12)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        gap: 6,
        marginBottom: 16,
    },
    badgeText: {
        color: ELECTRIC_ORANGE,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        fontWeight: '500',
    },
    planContainer: {
        gap: 16,
    },
    planCard: {
        backgroundColor: GLASS_WHITE,
        borderRadius: 28,
        padding: 24,
        borderWidth: 1.5,
        borderColor: GLASS_BORDER,
        overflow: 'hidden',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 24,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameBox: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 2,
    },
    planPrice: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    planPeriod: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 4,
        fontWeight: '600',
    },
    radio: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: GLASS_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: GLASS_BORDER,
        marginVertical: 20,
    },
    planDesc: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 20,
        fontWeight: '500',
        marginBottom: 20,
    },
    featureList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        color: '#CBD5E1',
        fontWeight: '600',
    },
    trustSection: {
        marginTop: Spacing.xl,
        gap: 12,
        alignItems: 'center',
        opacity: 0.8,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
    },
    footerGradient: {
        position: 'absolute',
        top: -60,
        left: 0,
        right: 0,
        height: 120,
    },
    actionContainer: {
        marginBottom: 10,
    },
    primaryBtn: {
        borderRadius: 22,
        overflow: 'hidden',
        height: 68,
        shadowColor: ELECTRIC_ORANGE,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
    },
    btnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.2,
    },
    btnIcon: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
});
