import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Pressable,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    TrendingUp,
    Zap,
    Clock,
    Users,
    Star,
    ChevronRight,
    BookOpen,
    Map,
    CalendarDays,
    Wallet,
    Tag,
    BarChart3,
    CheckCircle,
    AlertCircle,
    ArrowUpRight,
    Activity,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantDashboard } from '../../../lib/merchant';
import type { Agent } from '../../../lib/merchant';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Main Screen ───

export default function MerchantDashboardScreen() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            setError(false);
            const [dashRes, agentsRes] = await Promise.all([
                merchantApi.getDashboard(),
                merchantApi.getAgentStatusGrid(),
            ]);
            setDashboard(dashRes.data.dashboard);
            setAgents(agentsRes.data.agents);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

    if (loading) {
        return (
            <View style={[styles.loadingCenter, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error && !dashboard) {
        return (
            <View style={[styles.loadingCenter, { paddingTop: insets.top }]}>
                <AlertCircle size={48} color="#CBD5E1" strokeWidth={1.5} />
                <Text style={styles.errorTitle}>Failed to load dashboard</Text>
                <Text style={styles.errorSub}>Check your connection and try again</Text>
                <Pressable
                    onPress={() => { setLoading(true); fetchDashboard(); }}
                    style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
                >
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                // FIXED: Use insets.bottom + extra padding to ensure last content isn't cut off
                contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
            >
                <DashboardHero 
                    user={user} 
                    insets={insets} 
                    dashboard={dashboard} 
                />

                <RevenueCard 
                    dashboard={dashboard} 
                />

                <StatsBentoGrid 
                    dashboard={dashboard} 
                />

                <QuickActions />

                <TeamStatus agents={agents} />
            </ScrollView>
        </View>
    );
}

// ─── Modular Components ───

function DashboardHero({ user, insets, dashboard }: any) {
    const isVerified = dashboard?.verificationStatus === 'APPROVED';
    const rating = dashboard?.rating ?? 0;
    const totalReviews = dashboard?.totalReviews ?? 0;

    return (
        <View style={[styles.heroSection, { paddingTop: insets.top + Spacing.md }]}>
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                style={styles.heroBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            <View style={styles.heroMain}>
                <View style={styles.heroRow}>
                    {/* RATING AT START */}
                    <Animated.View entering={FadeInRight.delay(100).springify()} style={styles.ratingBadge}>
                        <Star size={24} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
                    </Animated.View>

                    <View style={styles.businessInfo}>
                        <Text style={styles.greetLabel}>{getTimeOfDay()} 👋</Text>
                        <Text style={styles.businessName} numberOfLines={1}>{user?.name || 'Dashboard'}</Text>
                    </View>

                    <Pressable 
                        onPress={() => router.push('/(merchant)/verification')}
                        style={({ pressed }) => [
                            styles.statusIconBadge,
                            isVerified ? styles.statusVerified : styles.statusPending,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        {isVerified ? (
                            <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
                        ) : (
                            <AlertCircle size={18} color="#F59E0B" strokeWidth={2.5} />
                        )}
                    </Pressable>
                </View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.heroStatsRow}>
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatLabel}>Reviews</Text>
                        <Text style={styles.heroStatValue}>{totalReviews}</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatLabel}>Status</Text>
                        <Text style={[styles.heroStatValue, { color: isVerified ? '#10B981' : '#F59E0B' }]}>
                            {isVerified ? 'Active' : 'Pending'}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

function RevenueCard({ dashboard }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.mainRevenueCard}>
            <LinearGradient
                colors={[Colors.primary, '#FF8533']}
                style={styles.revenueInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View>
                    <Text style={styles.revLabel}>Today's Earnings</Text>
                    <Text style={styles.revValue}>₹{(dashboard?.todayRevenue ?? 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.revGraphIcon}>
                    <TrendingUp size={24} color="#FFF" />
                </View>
            </LinearGradient>
            <View style={styles.revStats}>
                <View style={styles.revStatCol}>
                    <Text style={styles.revStatVal}>{dashboard?.todayOrders ?? 0}</Text>
                    <Text style={styles.revStatLabel}>Orders</Text>
                </View>
                <View style={styles.revStatDivider} />
                <View style={styles.revStatCol}>
                    <Text style={styles.revStatVal}>{dashboard?.activeOrders ?? 0}</Text>
                    <Text style={styles.revStatLabel}>Active</Text>
                </View>
                <View style={styles.revStatDivider} />
                <View style={styles.revStatCol}>
                    <Text style={[styles.revStatVal, dashboard?.pendingOrders ? { color: '#F59E0B' } : {}]}>
                        {dashboard?.pendingOrders ?? 0}
                    </Text>
                    <Text style={styles.revStatLabel}>Queue</Text>
                </View>
            </View>
        </Animated.View>
    );
}

function StatsBentoGrid({ dashboard }: any) {
    return (
        <View style={styles.statsBentoGrid}>
            <BentoItem
                icon={<Zap size={18} color={Colors.primary} />}
                label="Live Orders"
                value={dashboard?.activeOrders ?? 0}
                color={Colors.primary}
                delay={500}
            />
            <BentoItem
                icon={<Clock size={18} color="#F59E0B" />}
                label="Waiting"
                value={dashboard?.pendingOrders ?? 0}
                color="#F59E0B"
                delay={550}
            />
            <BentoItem
                icon={<Users size={18} color="#6366F1" />}
                label="Active Staff"
                value={dashboard?.agentCount ?? 0}
                color="#6366F1"
                delay={600}
            />
            <BentoItem
                icon={<Activity size={18} color="#0EA5E9" />}
                label="Success Rate"
                value="98%"
                color="#0EA5E9"
                delay={650}
            />
        </View>
    );
}

function QuickActions() {
    return (
        <View>
            <Text style={styles.sectionHeaderTitle}>Manage Business</Text>
            <View style={styles.actionsPillGrid}>
                <ActionItem icon={<BookOpen size={18} color={Colors.primary} />} label="Services" onPress={() => router.push('/(merchant)/(tabs)/catalog')} delay={700} />
                <ActionItem icon={<Users size={18} color="#6366F1" />} label="Agents" onPress={() => router.push('/(merchant)/agents')} delay={730} />
                <ActionItem icon={<Map size={18} color="#0EA5E9" />} label="Map View" onPress={() => router.push('/(merchant)/agents/map')} delay={760} />
                <ActionItem icon={<CalendarDays size={18} color="#14B8A6" />} label="Schedule" onPress={() => router.push('/(merchant)/schedule')} delay={790} />
                <ActionItem icon={<Wallet size={18} color={Colors.success} />} label="Payouts" onPress={() => router.push('/(merchant)/earnings')} delay={820} />
                <ActionItem icon={<Tag size={18} color="#EC4899" />} label="Coupons" onPress={() => router.push('/(merchant)/promotions')} delay={850} />
                <ActionItem icon={<BarChart3 size={18} color="#8B5CF6" />} label="Growth" onPress={() => router.push('/(merchant)/analytics')} delay={880} />
                <ActionItem icon={<Star size={18} color="#F59E0B" />} label="Reviews" onPress={() => router.push('/(merchant)/reviews')} delay={910} />
            </View>
        </View>
    );
}

function TeamStatus({ agents }: any) {
    return (
        <View>
            <View style={[styles.sectionHeading, { marginTop: 32 }]}>
                <Text style={styles.sectionHeaderTitle}>Team Real-time</Text>
                <Pressable onPress={() => router.push('/(merchant)/agents/map')}>
                    <Text style={styles.linkText}>See Map</Text>
                </Pressable>
            </View>

            {agents.length === 0 ? (
                <View style={styles.emptyAgents}>
                    <Text style={styles.emptyText}>No agents online</Text>
                </View>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.agentsList}
                >
                    {agents.map((agent: any, i: number) => {
                        const isOnline = agent.status !== 'OFFLINE';
                        const isBusy = agent.bookings && agent.bookings.length > 0;
                        const statusColor = !isOnline ? '#94A3B8' : isBusy ? '#F59E0B' : Colors.success;

                        return (
                            <Animated.View key={agent.id} entering={FadeIn.delay(950 + i * 50)}>
                                <Pressable 
                                    onPress={() => router.push(`/(merchant)/agents/${agent.id}` as any)}
                                    style={styles.agentSmallCard}
                                >
                                    <View style={styles.agentAvatarBox}>
                                        <Text style={styles.agentInitial}>{agent.user?.name?.[0] || 'A'}</Text>
                                        <View style={[styles.agentStatusIndicator, { backgroundColor: statusColor }]} />
                                    </View>
                                    <Text style={styles.agentMiniName} numberOfLines={1}>
                                        {agent.user?.name?.split(' ')[0]}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

// ─── Internal Atomic Components ───

function BentoItem({ icon, label, value, color, delay }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.bentoItem}>
            <View style={[styles.bentoIconBox, { backgroundColor: color + '10' }]}>{icon}</View>
            <View>
                <Text style={styles.bentoVal}>{value}</Text>
                <Text style={styles.bentoLab}>{label}</Text>
            </View>
        </Animated.View>
    );
}

function ActionItem({ icon, label, onPress, delay }: any) {
    return (
        <Animated.View entering={FadeIn.delay(delay)}>
            <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
            >
                <View style={styles.actionIconOuter}>{icon}</View>
                <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
        </Animated.View>
    );
}

function getTimeOfDay() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening';
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 },
    errorSub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
    retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    // ─── Hero Section ───
    heroSection: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 40,
        backgroundColor: '#0F172A',
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    heroBackground: { ...StyleSheet.absoluteFillObject },
    heroCircle1: {
        position: 'absolute', top: -50, right: -50, width: 200, height: 200,
        borderRadius: 100, backgroundColor: 'rgba(255,107,0,0.1)',
    },
    heroCircle2: {
        position: 'absolute', bottom: -100, left: -50, width: 250, height: 250,
        borderRadius: 125, backgroundColor: 'rgba(51,65,85,0.4)',
    },
    heroMain: { position: 'relative', zIndex: 1 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    
    ratingBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 12,
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ratingNumber: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    businessInfo: { flex: 1 },
    greetLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
    businessName: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 2 },
    
    statusIconBadge: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    statusVerified: { borderColor: 'rgba(16,185,129,0.3)' },
    statusPending: { borderColor: 'rgba(245,158,11,0.3)' },

    heroStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    heroStatItem: { flex: 1, alignItems: 'center' },
    heroStatLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    heroStatValue: { fontSize: 16, fontWeight: '800', color: '#FFF', marginTop: 2 },
    heroStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

    // ─── Revenue Card ───
    mainRevenueCard: {
        marginHorizontal: Spacing.lg,
        marginTop: -24,
        borderRadius: 28,
        backgroundColor: '#FFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
        overflow: 'hidden',
        zIndex: 2,
    },
    revenueInner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 24, paddingBottom: 32,
    },
    revLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
    revValue: { fontSize: 32, fontWeight: '900', color: '#FFF', marginTop: 4 },
    revGraphIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    
    revStats: { flexDirection: 'row', paddingVertical: 18, backgroundColor: '#FFF' },
    revStatCol: { flex: 1, alignItems: 'center' },
    revStatVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    revStatLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    revStatDivider: { width: 1, backgroundColor: '#F1F5F9', height: '60%', alignSelf: 'center' },

    // ─── Bento Grid ───
    statsBentoGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg, gap: 12, marginTop: 24,
    },
    bentoItem: {
        width: (SCREEN_W - Spacing.lg * 2 - 12) / 2,
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    bentoIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    bentoVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    bentoLab: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

    // ─── Quick Actions ───
    sectionHeaderTitle: {
        fontSize: 16, fontWeight: '800', color: '#0F172A',
        paddingHorizontal: Spacing.xl, marginTop: 32, marginBottom: 12,
    },
    actionsPillGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 10 },
    actionBtn: { width: (SCREEN_W - Spacing.lg * 2 - 30) / 4, alignItems: 'center', gap: 8 },
    actionIconOuter: {
        width: 54, height: 54, borderRadius: 18,
        backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    actionLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },

    // ─── Agents Scroller ───
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.xl },
    linkText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    agentsList: { paddingHorizontal: Spacing.lg, gap: 12, marginTop: 12 },
    agentSmallCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 12, alignItems: 'center',
        width: 80, borderWidth: 1, borderColor: '#EEF2FF',
    },
    agentAvatarBox: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    agentInitial: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    agentStatusIndicator: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
    agentMiniName: { fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 6 },
    emptyAgents: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
});
