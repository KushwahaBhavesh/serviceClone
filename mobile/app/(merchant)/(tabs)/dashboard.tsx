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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
    FadeInDown, 
    FadeIn, 
    FadeInRight,
} from 'react-native-reanimated';
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

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard])
    );
    
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
            <StatusBar style="dark" translucent />
            
            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <View style={styles.headerLeft}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.headerTitle}>{user?.name?.split(' ')[0] || 'Merchant'}</Text>
                    </View>
                    <Pressable 
                        onPress={() => router.push('/(merchant)/notifications')}
                        style={styles.headerIcon}
                    >
                        <Zap size={20} color={Colors.primary} />
                        <View style={styles.headerDot} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[Colors.primary]} 
                        tintColor="#FFF"
                        progressViewOffset={insets.top + 60}
                    />
                }
                contentContainerStyle={{
                    paddingTop: insets.top + 60,
                    paddingBottom: insets.bottom + 120
                }}
            >
                <PrismHero
                    user={user}
                    dashboard={dashboard}
                />

                <PremiumRevenue
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

function PrismHero({ user, dashboard }: any) {
    const isVerified = dashboard?.verificationStatus === 'APPROVED';
    const rating = dashboard?.rating ?? 0;

    return (
        <View style={styles.prismHero}>
            <View style={styles.heroContent}>
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.welcomeText}>WELCOME BACK</Text>
                    <Text style={styles.heroBusinessName}>{user?.name || 'Dashboard'}</Text>
                </Animated.View>

                <Animated.View entering={FadeInRight.delay(400).springify()} style={styles.heroBadges}>
                    <View style={[styles.statusBadge, isVerified ? styles.statusApproved : styles.statusPending]}>
                        <CheckCircle size={10} color={isVerified ? '#10B981' : '#F59E0B'} />
                        <Text style={[styles.statusText, { color: isVerified ? '#10B981' : '#F59E0B' }]}>
                            {isVerified ? 'VERIFIED' : 'PENDING'}
                        </Text>
                    </View>
                    <View style={styles.heroRating}>
                        <Star size={10} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                    </View>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.heroQuickPulse}>
                <BlurView intensity={20} tint="light" style={styles.pulseInner}>
                    <View style={styles.pulseItem}>
                        <Activity size={14} color="#64748B" />
                        <Text style={styles.pulseLabel}>Active Now</Text>
                        <Text style={styles.pulseValue}>{dashboard?.agentCount || 0} Agents</Text>
                    </View>
                    <View style={styles.pulseDivider} />
                    <View style={styles.pulseItem}>
                        <Clock size={14} color="#64748B" />
                        <Text style={styles.pulseLabel}>Avg. Wait</Text>
                        <Text style={styles.pulseValue}>12.5m</Text>
                    </View>
                </BlurView>
            </Animated.View>
        </View>
    );
}

function PremiumRevenue({ dashboard }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.prismRevenueBox}>
            <LinearGradient
                colors={[Colors.primary, '#FF8533']}
                style={styles.revenuePrismGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.revMainHeader}>
                    <View>
                        <Text style={styles.revTitle}>TODAY'S REVENUE</Text>
                        <Text style={styles.revAmount}>₹{(dashboard?.todayRevenue ?? 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.revTrendPill}>
                        <ArrowUpRight size={12} color="#FFF" />
                        <Text style={styles.revTrendText}>+18.5%</Text>
                    </View>
                </View>

                <View style={styles.revStatsRow}>
                    <View style={styles.revStatCol}>
                        <Text style={styles.revStatLab}>ORDERS</Text>
                        <Text style={styles.revStatVal}>{dashboard?.todayOrders || 0}</Text>
                    </View>
                    <View style={styles.revStatCol}>
                        <Text style={styles.revStatLab}>PENDING</Text>
                        <Text style={styles.revStatVal}>{dashboard?.pendingOrders || 0}</Text>
                    </View>
                    <View style={styles.revStatCol}>
                        <Text style={styles.revStatLab}>RATING</Text>
                        <Text style={styles.revStatVal}>{dashboard?.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                </View>

                {/* Decorative Accents */}
                <View style={styles.prismGlassOverlay} />
                <View style={[styles.prismGlowCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            </LinearGradient>
        </Animated.View>
    );
}

function StatsBentoGrid({ dashboard }: any) {
    return (
        <View style={styles.statsBentoGrid}>
            <BentoItem
                icon={<Activity size={20} color={Colors.primary} />}
                label="Efficiency"
                value="94%"
                trend="+2%"
                delay={500}
            />
            <BentoItem
                icon={<Clock size={20} color="#F59E0B" />}
                label="Avg. Wait"
                value="14m"
                trend="-3m"
                delay={550}
            />
            <BentoItem
                icon={<Star size={20} color="#8B5CF6" />}
                label="Rating"
                value={dashboard?.rating?.toFixed(1) || "4.8"}
                delay={600}
            />
            <BentoItem
                icon={<Users size={20} color="#10B981" />}
                label="Satisfaction"
                value="98%"
                delay={650}
            />
        </View>
    );
}

function QuickActions() {
    return (
        <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeading}>
                <Text style={styles.sectionHeaderTitle}>Manage Operations</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.actionsScroller}
            >
                <ActionItem icon={<BookOpen size={20} color="#FFF" />} label="Catalog" color="#6366F1" onPress={() => router.push('/(merchant)/(tabs)/catalog')} delay={700} />
                <ActionItem icon={<Users size={20} color="#FFF" />} label="Team" color="#8B5CF6" onPress={() => router.push('/(merchant)/agents')} delay={730} />
                <ActionItem icon={<Map size={20} color="#FFF" />} label="Map" color="#10B981" onPress={() => router.push('/(merchant)/agents/map')} delay={760} />
                <ActionItem icon={<CalendarDays size={20} color="#FFF" />} label="Schedule" color="#F59E0B" onPress={() => router.push('/(merchant)/schedule')} delay={790} />
                <ActionItem icon={<Wallet size={20} color="#FFF" />} label="Payouts" color="#EC4899" onPress={() => router.push('/(merchant)/earnings')} delay={820} />
                <ActionItem icon={<BarChart3 size={20} color="#FFF" />} label="Analytics" color={Colors.primary} onPress={() => router.push('/(merchant)/analytics')} delay={850} />
            </ScrollView>
        </View>
    );
}

function TeamStatus({ agents }: any) {
    return (
        <View style={styles.teamSection}>
            <View style={styles.sectionHeading}>
                <Text style={styles.sectionHeaderTitle}>Real-time Network</Text>
                <Pressable onPress={() => router.push('/(merchant)/agents/map')}>
                    <Text style={styles.linkText}>View Global Map</Text>
                </Pressable>
            </View>

            {agents.length === 0 ? (
                <View style={styles.emptyAgents}>
                    <BlurView intensity={10} tint="dark" style={styles.emptyBlur}>
                        <Users size={32} color="#94A3B8" strokeWidth={1.5} />
                        <Text style={styles.emptyText}>No active agents found</Text>
                    </BlurView>
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
                        const statusColor = !isOnline ? '#94A3B8' : isBusy ? '#F59E0B' : '#10B981';

                        return (
                            <Animated.View key={agent.id} entering={FadeIn.delay(950 + i * 50)}>
                                <Pressable
                                    onPress={() => router.push(`/(merchant)/agents/${agent.id}` as any)}
                                    style={styles.agentCard}
                                >
                                    <View style={styles.agentAvatarBox}>
                                        <View style={styles.agentAvatarPlaceholder}>
                                            <Text style={styles.agentInitial}>{agent.user?.name?.[0] || 'A'}</Text>
                                        </View>
                                        <View style={[styles.agentStatusIndicator, { backgroundColor: statusColor }]} />
                                    </View>
                                    <Text style={styles.agentName} numberOfLines={1}>
                                        {agent.user?.name?.split(' ')[0]}
                                    </Text>
                                    <Text style={styles.agentSubText}>{isBusy ? 'Busy' : 'Available'}</Text>
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

function BentoItem({ icon, label, value, trend, delay }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.bentoItem}>
            <View style={styles.bentoHeader}>
                <View style={styles.bentoIconBox}>{icon}</View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trend.startsWith('+') ? '#10B98120' : '#F59E0B20' }]}>
                        <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#10B981' : '#F59E0B' }]}>{trend}</Text>
                    </View>
                )}
            </View>
            <View style={styles.bentoBody}>
                <Text style={styles.bentoVal}>{value}</Text>
                <Text style={styles.bentoLab}>{label}</Text>
            </View>
        </Animated.View>
    );
}

function ActionItem({ icon, label, color, onPress, delay }: any) {
    return (
        <Animated.View entering={FadeIn.delay(delay)}>
            <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            >
                <View style={[styles.actionIconOuter, { backgroundColor: color }]}>
                    {icon}
                </View>
                <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
        </Animated.View>
    );
}

function getTimeOfDay() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    errorTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 12 },
    errorSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
    retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
    retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    // ─── Sticky Header ───
    stickyHeader: {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 100, overflow: 'hidden',
    },
    headerContent: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 24,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    headerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    },
    headerDot: {
        position: 'absolute', top: 10, right: 10, width: 6, height: 6,
        borderRadius: 3, backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: '#FFF',
    },

    // ─── Prism Hero ───
    prismHero: { paddingHorizontal: 24, paddingBottom: 24, marginTop: 20 },
    heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    welcomeText: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5 },
    heroBusinessName: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginTop: 4, letterSpacing: -1 },
    heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1
    },
    statusApproved: { backgroundColor: '#10B98110', borderColor: '#10B98130' },
    statusPending: { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' },
    statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    heroRating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingValue: { fontSize: 11, fontWeight: '800', color: '#F59E0B' },

    heroQuickPulse: { marginTop: 24, borderRadius: 20, overflow: 'hidden' },
    pulseInner: {
        flexDirection: 'row', padding: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    pulseItem: { flex: 1, gap: 2 },
    pulseLabel: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
    pulseValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    pulseDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

    // ─── Premium Revenue ───
    prismRevenueBox: { marginHorizontal: 20, marginTop: 12, borderRadius: 28, overflow: 'hidden', elevation: 8 },
    revenuePrismGradient: { padding: 24, minHeight: 180 },
    revMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    revTitle: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
    revAmount: { fontSize: 38, fontWeight: '900', color: '#FFF', marginTop: 6, letterSpacing: -1.5 },
    revTrendPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12
    },
    revTrendText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
    revStatsRow: { flexDirection: 'row', marginTop: 32, gap: 20 },
    revStatCol: { flex: 1 },
    revStatLab: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    revStatVal: { fontSize: 18, fontWeight: '900', color: '#FFF', marginTop: 2 },
    prismGlassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.05)' },
    prismGlowCircle: {
        position: 'absolute', top: -50, right: -50, width: 150, height: 150,
        borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)'
    },

    // ─── Bento Grid ───
    statsBentoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginTop: 24 },
    bentoItem: {
        width: (SCREEN_W - 40 - 12) / 2,
        backgroundColor: '#FFF', borderRadius: 24, padding: 20,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 10,
    },
    bentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    bentoIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    trendText: { fontSize: 10, fontWeight: '800' },
    bentoBody: { gap: 2 },
    bentoVal: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    bentoLab: { fontSize: 12, fontWeight: '600', color: '#64748B' },

    // ─── Quick Actions ───
    quickActionsSection: { marginTop: 32 },
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    sectionHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    actionsScroller: { paddingHorizontal: 20, gap: 12 },
    actionBtn: { width: 90, alignItems: 'center', gap: 10 },
    actionIconOuter: {
        width: 64, height: 64, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    actionLabel: { fontSize: 11, fontWeight: '800', color: '#64748B' },

    // ─── Team Section ───
    teamSection: { marginTop: 40 },
    linkText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    agentsList: { paddingHorizontal: 20, gap: 16, marginTop: 4 },
    agentCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16, alignItems: 'center',
        width: 110, borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 10,
    },
    agentAvatarBox: { position: 'relative', marginBottom: 12 },
    agentAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    agentInitial: { fontSize: 20, fontWeight: '900', color: Colors.primary },
    agentStatusIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFF' },
    agentName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
    agentSubText: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },
    emptyAgents: { paddingHorizontal: 20, marginTop: 4 },
    emptyBlur: {
        padding: 40, alignItems: 'center', gap: 12, borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: 'rgba(255,255,255,0.5)'
    },
    emptyText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
});
