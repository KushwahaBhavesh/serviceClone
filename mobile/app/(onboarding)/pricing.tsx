import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
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
    FadeInRight,
    SlideInDown,
} from 'react-native-reanimated';
import {
    ChevronLeft,
    Sparkles,
    CheckCircle2,
    Zap,
    ShieldCheck,
    Crown,
    Star,
    ChevronRight,
    Infinity,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types/auth';

// ─── Constants ───
const PLANS = [
    {
        id: 'STARTER',
        name: 'Basic',
        price: 'Free',
        period: '/ forever',
        description: 'Perfect for independent professionals getting started.',
        features: ['1 Business Profile', 'Manage 2 Agents', 'Basic Analytics', 'Standard Support'],
        icon: Star,
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
        icon: Crown,
        color: '#A855F7',
        isPopular: false,
    },
] as const;

export default function PricingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError } = useToast();
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
            showSuccess('Welcome to the Oracle Network!');
            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error('Onboarding Error:', error);
            showError(error.message || 'We could not complete your registration.');
        }
    };

    const handleSelectPlan = (id: 'STARTER' | 'PRO' | 'ELITE') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlan(id);
    };

    // ─── Render ───
    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Sticky Oracle Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>PARTNER PLANS</Text>
                        <Text style={styles.headerSubtitle}>Scale your empire</Text>
                    </View>
                    <Animated.View entering={FadeInRight} style={styles.oracleBadge}>
                        <Sparkles size={12} color={Colors.primary} strokeWidth={3} />
                        <Text style={styles.oracleBadgeText}>ORACLE</Text>
                    </Animated.View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                    <View style={styles.heroSection}>
                        <Text style={styles.heroTitle}>Choose your power</Text>
                        <Text style={styles.heroSubtitle}>
                            Select a plan that fuels your business trajectory. No hidden fees, just pure growth.
                        </Text>
                    </View>
                </Animated.View>

                {/* Pricing Cards */}
                <View style={styles.planContainer}>
                    {PLANS.map((plan, index) => {
                        const isSelected = selectedPlan === plan.id;
                        const Icon = plan.icon;

                        return (
                            <Animated.View
                                key={plan.id}
                                entering={FadeInUp.delay(200 + index * 100).springify()}
                            >
                                <Pressable
                                    onPress={() => handleSelectPlan(plan.id)}
                                    style={[
                                        styles.planCard,
                                        isSelected && { borderColor: plan.color, backgroundColor: '#FFFFFF' }
                                    ]}
                                >
                                    {plan.isPopular && (
                                        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                                            <Sparkles size={10} color="#FFF" />
                                            <Text style={styles.popularText}>MOST POPULAR</Text>
                                        </View>
                                    )}

                                    <View style={styles.planHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: plan.color + '15' }]}>
                                            <Icon size={24} color={plan.color} strokeWidth={2.5} />
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
                                            {isSelected && <CheckCircle2 size={16} color="#FFF" strokeWidth={3} />}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.planDesc}>{plan.description}</Text>

                                    <View style={styles.featureList}>
                                        {plan.features.map((feature) => (
                                            <View key={feature} style={styles.featureItem}>
                                                <CheckCircle2 size={16} color={plan.color} strokeWidth={2.5} />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Trust Pulse Section */}
                <Animated.View entering={FadeInUp.delay(600)} style={styles.trustSection}>
                    <View style={styles.trustCard}>
                        <ShieldCheck size={20} color="#64748B" strokeWidth={2} />
                        <Text style={styles.trustText}>Enterprise-grade security by Razorpay</Text>
                    </View>
                    <View style={styles.trustCard}>
                        <Infinity size={20} color="#64748B" strokeWidth={2} />
                        <Text style={styles.trustText}>Unlimited flexibility. Change plans anytime.</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Immersive Floating Action Bar */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.footerContent}>
                    <Animated.View entering={SlideInDown.delay(300)}>
                        <Pressable
                            onPress={handleComplete}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                isLoading && styles.btnDisabled,
                                pressed && !isLoading && { transform: [{ scale: 0.98 }] }
                            ]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF7A00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.btnText}>ACTIVATE ACCOUNT</Text>
                                        <ChevronRight size={22} color="#FFF" strokeWidth={2.5} />
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20 },

    // Hero Section
    heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    heroTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', textAlign: 'center', letterSpacing: -1 },
    heroSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '500', paddingHorizontal: 10 },

    // Plan Cards
    planContainer: { gap: 16 },
    planCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, borderWidth: 2, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, overflow: 'hidden' },
    popularBadge: { position: 'absolute', top: 0, right: 30, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    popularText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    planHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    nameBox: { flex: 1 },
    planName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    planPrice: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    planPeriod: { fontSize: 13, color: '#64748B', marginLeft: 4, fontWeight: '700' },
    radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

    divider: { height: 1.5, backgroundColor: '#F8FAFC', marginVertical: 20 },
    planDesc: { fontSize: 14, color: '#64748B', lineHeight: 20, fontWeight: '600', marginBottom: 20 },

    featureList: { gap: 12 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },

    // Trust Section
    trustSection: { marginTop: 30, gap: 12 },
    trustCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F1F5F9', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    trustText: { fontSize: 12, color: '#64748B', fontWeight: '700' },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden' },
    footerContent: { paddingHorizontal: 25, paddingVertical: 20 },
    primaryBtn: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    btnText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
    btnDisabled: { opacity: 0.6 },
});
