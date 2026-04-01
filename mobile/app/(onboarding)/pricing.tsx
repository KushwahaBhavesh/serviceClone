import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Dimensions,
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types/auth';

const { width } = Dimensions.get('window');

// ─── Constants ───
const PLANS = [
    {
        id: 'STARTER',
        name: 'Basic',
        price: 'Free',
        period: '/ forever',
        description: 'Perfect for independent professionals getting started.',
        features: ['1 Business Profile', 'Manage 2 Agents', 'Basic Analytics', 'Standard Support'],
        icon: 'hammer-outline' as const,
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
        icon: 'flash-outline' as const,
        color: Colors.primary,
        isPopular: true,
    },
    {
        id: 'ELITE',
        name: 'Enterprise',
        price: '₹4,999',
        period: '/ month',
        description: 'Advanced tools for large multi-city companies.',
        features: ['Unlimited Agents', 'Multi-location Management', 'White-labeled Reports', 'Dedicated Account Manager', 'Custom API Access'],
        icon: 'star-outline' as const,
        color: '#A855F7',
        isPopular: false,
    },
];

export default function PricingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { 
        role, email, name, businessName, businessCategory, 
        description, locationName, latitude, longitude, skills 
    } = useLocalSearchParams<{
        role: UserRole;
        email: string;
        name?: string;
        businessName?: string;
        businessCategory?: string;
        description?: string;
        locationName?: string;
        latitude?: string;
        longitude?: string;
        skills?: string;
    }>();

    const { completeOnboarding, isLoading, user } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ELITE'>('PRO');

    // ─── Logic ───
    const handleComplete = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const cleanStr = (val: any) => {
                if (!val || val === 'null' || val === 'undefined') return undefined;
                return String(val);
            };

            const parsedLat = latitude ? parseFloat(latitude) : undefined;
            const parsedLng = longitude ? parseFloat(longitude) : undefined;

            if (latitude && isNaN(parsedLat!)) throw new Error("Invalid latitude format");
            if (longitude && isNaN(parsedLng!)) throw new Error("Invalid longitude format");

            await completeOnboarding({
                role: (cleanStr(role) as any) || 'MERCHANT',
                email: cleanStr(email),
                name: cleanStr(name) || user?.name || undefined,
                businessName: cleanStr(businessName),
                businessCategory: cleanStr(businessCategory),
                description: cleanStr(description),
                locationName: cleanStr(locationName),
                latitude: parsedLat,
                longitude: parsedLng,
                selectedPlan,
                skills: skills && skills !== 'undefined' ? JSON.parse(skills) : undefined,
            });
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error('Onboarding Error:', error);
            Alert.alert(
                'Registration Failed', 
                error.message || 'We could not complete your registration. Please try again.'
            );
        }
    };

    const handleSelectPlan = (id: 'STARTER' | 'PRO' | 'ELITE') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlan(id);
    };

    // ─── Render ───
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 120 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                    <View style={styles.header}>
                        <View style={styles.navbar}>
                            <Pressable
                                onPress={() => router.back()}
                                style={({ pressed }) => [
                                    styles.navBtn,
                                    pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                                ]}
                            >
                                <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                            </Pressable>
                            <View style={styles.badge}>
                                <Ionicons name="flash" size={12} color={Colors.primary} />
                                <Text style={styles.badgeText}>PARTNER PROGRAM</Text>
                            </View>
                        </View>
                        <Text style={styles.title}>Power up your business</Text>
                        <Text style={styles.subtitle}>
                            Select a plan that fits your growth goals. {'\n'}
                            Flexible plans for every stage.
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
                                entering={FadeInUp.delay(200 + index * 100).duration(600)}
                            >
                                <Pressable
                                    onPress={() => handleSelectPlan(plan.id as any)}
                                    style={[
                                        styles.planCard,
                                        isSelected && { borderColor: plan.color, backgroundColor: '#FFFFFF', elevation: 4 }
                                    ]}
                                >
                                    {plan.isPopular && (
                                        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                                            <Text style={styles.popularText}>MOST POPULAR</Text>
                                        </View>
                                    )}

                                    <View style={styles.planHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: plan.color + '15' }]}>
                                            <Ionicons name={plan.icon} size={24} color={plan.color} />
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
                                            {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.planDesc}>{plan.description}</Text>

                                    <View style={styles.featureList}>
                                        {plan.features.map((feature, fIdx) => (
                                            <View key={fIdx} style={styles.featureItem}>
                                                <View style={styles.checkIcon}>
                                                    <Ionicons name="checkmark-circle" size={18} color={plan.color} />
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
                <Animated.View entering={FadeInUp.delay(600)} style={styles.trustSection}>
                    <View style={styles.trustItem}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
                        <Text style={styles.trustText}>Secure payments by Razorpay</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Ionicons name="refresh-outline" size={20} color="#64748B" />
                        <Text style={styles.trustText}>Cancel or switch plans anytime</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                
                <Animated.View entering={FadeInUp.delay(800)} style={styles.actionContainer}>
                    <Pressable
                        onPress={handleComplete}
                        disabled={isLoading}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && !isLoading && { transform: [{ scale: 0.98 }] },
                            isLoading && styles.btnDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#E66100']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.btnText}>Complete Onboarding</Text>
                                    <View style={styles.btnIcon}>
                                        <Ionicons name="chevron-forward" size={20} color="#FFF" />
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
        backgroundColor: Colors.background,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    decoration: {
        position: 'absolute',
        borderRadius: 100,
    },
    decor1: {
        width: 250,
        height: 250,
        backgroundColor: Colors.primary + '08',
        top: -80,
        right: -80,
    },
    decor2: {
        width: 150,
        height: 150,
        backgroundColor: Colors.secondary + '08',
        bottom: '10%',
        left: -50,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        gap: 6,
        marginLeft: 12,
    },
    badgeText: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.textDark,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
        fontWeight: '600',
    },
    planContainer: {
        gap: 16,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    popularText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameBox: {
        flex: 1,
    },
    planName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textDark,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 2,
    },
    planPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.textDark,
    },
    planPeriod: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
        fontWeight: '700',
    },
    radio: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    planDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    featureList: {
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkIcon: {
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 13,
        color: Colors.textDark,
        fontWeight: '600',
    },
    trustSection: {
        marginTop: Spacing.xl,
        gap: 10,
        alignItems: 'center',
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 16,
    },
    footerGradient: {
        position: 'absolute',
        top: -60,
        left: 0,
        right: 0,
        height: 60,
    },
    actionContainer: {
        marginVertical: 16,
    },
    primaryBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        height: 64,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    btnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    btnIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
});
