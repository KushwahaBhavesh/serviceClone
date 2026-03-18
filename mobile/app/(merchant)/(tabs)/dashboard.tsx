import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Pressable,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
} from 'lucide-react-native';

import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantDashboard } from '../../../lib/merchant';
import type { Agent } from '../../../lib/merchant';

// ─── Stat Card ───
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    accentColor: string;
    delay?: number;
}

function StatCard({ icon, label, value, accentColor, delay = 0 }: StatCardProps) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: accentColor + '14' }]}>
                {icon}
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
        </Animated.View>
    );
}

// ─── Quick Action ───
interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    delay?: number;
}

function QuickAction({ icon, label, onPress, delay = 0 }: QuickActionProps) {
    return (
        <Animated.View entering={FadeIn.delay(delay)}>
            <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
                style={({ pressed }) => [
                    styles.quickAction,
                    pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
                ]}
            >
                <View style={styles.quickActionIcon}>{icon}</View>
                <Text style={styles.quickActionText}>{label}</Text>
            </Pressable>
        </Animated.View>
    );
}

export default function MerchantDashboardScreen() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            const [dashRes, agentsRes] = await Promise.all([
                merchantApi.getDashboard(),
                merchantApi.getAgentStatusGrid(),
            ]);
            setDashboard(dashRes.data.dashboard);
            setAgents(agentsRes.data.agents);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
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

    const isVerified = dashboard?.verificationStatus === 'APPROVED';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ═══ Header ═══ */}
                <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
                        <Text style={styles.businessName}>{user?.name || 'Business Dashboard'}</Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(merchant)/verification')}
                        style={({ pressed }) => [
                            styles.verifyBadge,
                            isVerified ? styles.verifyBadgeApproved : styles.verifyBadgePending,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        {isVerified ? (
                            <CheckCircle size={14} color={Colors.success} strokeWidth={2.5} />
                        ) : (
                            <AlertCircle size={14} color="#F59E0B" strokeWidth={2.5} />
                        )}
                        <Text style={[styles.verifyText, { color: isVerified ? Colors.success : '#F59E0B' }]}>
                            {isVerified ? 'Verified' : 'Pending'}
                        </Text>
                    </Pressable>
                </View>

                {/* ═══ KPI Grid ═══ */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<TrendingUp size={20} color={Colors.success} strokeWidth={2.5} />}
                        label="Today's Revenue"
                        value={`₹${(dashboard?.todayRevenue ?? 0).toLocaleString()}`}
                        accentColor={Colors.success}
                        delay={100}
                    />
                    <StatCard
                        icon={<Zap size={20} color={Colors.primary} strokeWidth={2.5} />}
                        label="Active Orders"
                        value={dashboard?.activeOrders ?? 0}
                        accentColor={Colors.primary}
                        delay={150}
                    />
                    <StatCard
                        icon={<Clock size={20} color="#F59E0B" strokeWidth={2.5} />}
                        label="Pending"
                        value={dashboard?.pendingOrders ?? 0}
                        accentColor="#F59E0B"
                        delay={200}
                    />
                    <StatCard
                        icon={<Users size={20} color="#6366F1" strokeWidth={2.5} />}
                        label="Agents"
                        value={dashboard?.agentCount ?? 0}
                        accentColor="#6366F1"
                        delay={250}
                    />
                </View>

                {/* ═══ Rating Card ═══ */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.ratingCard}>
                    <LinearGradient
                        colors={['#FFF7ED', '#FFFBF5']}
                        style={styles.ratingGradient}
                    >
                        <View style={styles.ratingLeft}>
                            <View style={styles.ratingStarRow}>
                                <Star size={24} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.ratingValue}>{(dashboard?.rating ?? 0).toFixed(1)}</Text>
                            </View>
                            <Text style={styles.ratingSubtext}>
                                {dashboard?.totalReviews ?? 0} reviews
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.push('/(merchant)/reviews')}
                            style={({ pressed }) => [styles.viewReviewsBtn, pressed && { opacity: 0.7 }]}
                        >
                            <Text style={styles.viewReviewsText}>View All</Text>
                            <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
                        </Pressable>
                    </LinearGradient>
                </Animated.View>

                {/* ═══ Quick Actions ═══ */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickActionsScroll}
                >
                    <QuickAction
                        icon={<BookOpen size={20} color={Colors.primary} strokeWidth={2} />}
                        label="Services"
                        onPress={() => router.push('/(merchant)/(tabs)/catalog')}
                        delay={350}
                    />
                    <QuickAction
                        icon={<Users size={20} color="#6366F1" strokeWidth={2} />}
                        label="Agents"
                        onPress={() => router.push('/(merchant)/agents')}
                        delay={400}
                    />
                    <QuickAction
                        icon={<Map size={20} color="#0EA5E9" strokeWidth={2} />}
                        label="Live Map"
                        onPress={() => router.push('/(merchant)/agents/map')}
                        delay={450}
                    />
                    <QuickAction
                        icon={<CalendarDays size={20} color="#14B8A6" strokeWidth={2} />}
                        label="Schedule"
                        onPress={() => router.push('/(merchant)/schedule')}
                        delay={500}
                    />
                    <QuickAction
                        icon={<Wallet size={20} color={Colors.success} strokeWidth={2} />}
                        label="Earnings"
                        onPress={() => router.push('/(merchant)/earnings')}
                        delay={550}
                    />
                    <QuickAction
                        icon={<Tag size={20} color="#EC4899" strokeWidth={2} />}
                        label="Promos"
                        onPress={() => router.push('/(merchant)/promotions')}
                        delay={600}
                    />
                    <QuickAction
                        icon={<BarChart3 size={20} color="#8B5CF6" strokeWidth={2} />}
                        label="Analytics"
                        onPress={() => router.push('/(merchant)/analytics')}
                        delay={650}
                    />
                </ScrollView>

                {/* ═══ Agent Status ═══ */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Agent Status</Text>
                    <Pressable
                        onPress={() => router.push('/(merchant)/agents/map')}
                        style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                        <Text style={styles.seeAllLink}>View Map →</Text>
                    </Pressable>
                </View>

                {agents.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Users size={32} color="#CBD5E1" strokeWidth={1.5} />
                        <Text style={styles.emptyText}>No agents available</Text>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.agentScrollRow}
                    >
                        {agents.map((agent, idx) => {
                            const isBusy = agent.bookings && agent.bookings.length > 0;
                            const isOffline = agent.status === 'OFFLINE';
                            const statusColor = isOffline ? '#CBD5E1' : isBusy ? '#F59E0B' : Colors.success;

                            return (
                                <Animated.View key={agent.id} entering={FadeIn.delay(300 + idx * 80)}>
                                    <Pressable
                                        onPress={() => router.push(`/(merchant)/agents/${agent.id}` as any)}
                                        style={({ pressed }) => [
                                            styles.agentChip,
                                            pressed && { transform: [{ scale: 0.96 }] },
                                        ]}
                                    >
                                        <View style={styles.agentAvatarWrap}>
                                            <View style={styles.agentAvatar}>
                                                <Text style={styles.agentAvatarText}>
                                                    {agent.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                </Text>
                                            </View>
                                            <View style={[styles.agentDot, { backgroundColor: statusColor }]} />
                                        </View>
                                        <Text style={styles.agentName} numberOfLines={1}>
                                            {agent.user?.name?.split(' ')[0] || 'Agent'}
                                        </Text>
                                        <Text style={[styles.agentStatus, { color: statusColor }]}>
                                            {isOffline ? 'Offline' : isBusy ? 'Busy' : 'Free'}
                                        </Text>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                )}

                {/* ═══ Today's Summary ═══ */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>
                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Orders</Text>
                        <Text style={styles.summaryValue}>{dashboard?.todayOrders ?? 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Active Orders</Text>
                        <Text style={styles.summaryValue}>{dashboard?.activeOrders ?? 0}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.summaryRowLast]}>
                        <Text style={styles.summaryLabel}>Pending Approval</Text>
                        <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                            {dashboard?.pendingOrders ?? 0}
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

function getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },

    // ─── Header ───
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    headerLeft: { flex: 1 },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    businessName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
        marginTop: 2,
    },
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 5,
    },
    verifyBadgeApproved: {
        backgroundColor: Colors.success + '12',
    },
    verifyBadgePending: {
        backgroundColor: '#FEF3C7',
    },
    verifyText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // ─── Stats Grid ───
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        gap: 12,
    },
    statCard: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 16,
        width: '47%' as any,
        flexGrow: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    statAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },

    // ─── Rating ───
    ratingCard: {
        marginHorizontal: Spacing.lg,
        marginTop: 16,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    ratingGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
    },
    ratingLeft: {},
    ratingStarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
    },
    ratingSubtext: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    viewReviewsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    viewReviewsText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },

    // ─── Quick Actions ───
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        paddingHorizontal: Spacing.xl,
        marginTop: 24,
        marginBottom: 12,
    },
    quickActionsScroll: {
        paddingHorizontal: Spacing.lg,
        gap: 12,
    },
    quickAction: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        width: 88,
        gap: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    quickActionIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
        textAlign: 'center',
    },

    // ─── Agent Status ───
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: Spacing.xl,
    },
    seeAllLink: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    agentScrollRow: {
        paddingHorizontal: Spacing.lg,
        gap: 12,
    },
    agentChip: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        width: 90,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    agentAvatarWrap: {
        position: 'relative',
        marginBottom: 8,
    },
    agentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '14',
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentAvatarText: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.primary,
    },
    agentDot: {
        width: 13,
        height: 13,
        borderRadius: 7,
        position: 'absolute',
        bottom: -1,
        right: -2,
        borderWidth: 2.5,
        borderColor: '#FFF',
    },
    agentName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
    },
    agentStatus: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },

    // ─── Summary Card ───
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 20,
        marginHorizontal: Spacing.lg,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        // elevation: 2,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    summaryRowLast: {
        borderBottomWidth: 0,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
});
