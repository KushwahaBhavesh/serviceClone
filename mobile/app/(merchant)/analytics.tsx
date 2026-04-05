import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, TrendingUp, Briefcase, Users, Star,
    BarChart3,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import api from '../../lib/api';
import { AnalyticsDashboard } from '../../lib/merchant';
import { useToast } from '../../context/ToastContext';

const MERCHANT = '/api/v1/merchant';
type FilterDays = 7 | 30 | 90;
const FILTERS: { value: FilterDays; label: string }[] = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
];

function BarChart({ data }: { data: { date: string; amount: number }[] }) {
    if (data.length === 0) {
        return (
            <View style={styles.emptyChart}>
                <BarChart3 size={28} color="#CBD5E1" strokeWidth={1.5} />
                <Text style={styles.emptyChartText}>No revenue data for this period.</Text>
            </View>
        );
    }
    const maxAmount = Math.max(...data.map(d => d.amount));
    const displayData = data.length > 20
        ? data.filter((_, i) => i % Math.ceil(data.length / 14) === 0) : data;
    return (
        <View style={styles.chartRoot}>
            <View style={styles.barsRow}>
                {displayData.map((item, i) => {
                    const heightPct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    const d = new Date(item.date);
                    return (
                        <View key={i} style={styles.barGroup}>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { height: `${heightPct}%` as any }]} />
                            </View>
                            <Text style={styles.barLabel}>{d.getDate()}/{d.getMonth() + 1}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function ServiceRow({ rank, name, count, revenue, maxRevenue }: { rank: number; name: string; count: number; revenue: number; maxRevenue: number }) {
    const widthPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
    return (
        <View style={styles.serviceRow}>
            <View style={styles.serviceHeader}>
                <View style={styles.serviceRankBox}>
                    <Text style={styles.serviceRankText}>{rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.serviceCount}>{count} booking{count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.serviceRevenue}>₹{revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${widthPct}%` as any }]} />
            </View>
        </View>
    );
}

function AgentRow({ rank, name, rating, completedJobs }: { rank: number; name: string; rating: number; completedJobs: number }) {
    return (
        <View style={styles.agentRow}>
            <View style={styles.agentRankBox}>
                <Text style={styles.agentRankText}>{rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{name}</Text>
                <View style={styles.agentMeta}>
                    <Briefcase size={11} color="#94A3B8" strokeWidth={2} />
                    <Text style={styles.agentMetaText}>{completedJobs} jobs</Text>
                    <View style={styles.metaDot} />
                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.agentMetaText}>{rating.toFixed(1)}</Text>
                </View>
            </View>
        </View>
    );
}

export default function MerchantAnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showError } = useToast();
    const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [daysFilter, setDaysFilter] = useState<FilterDays>(30);

    const totalRevenue = analytics?.revenueTrends.reduce((sum, item) => sum + item.amount, 0) ?? 0;

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ analytics: AnalyticsDashboard }>(
                MERCHANT + '/analytics', { params: { days: daysFilter } },
            );
            setAnalytics(res.data.analytics);
        } catch (error: any) {
            showError(error.response?.data?.error ?? 'Failed to load analytics');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [daysFilter]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
                {FILTERS.map(({ value, label }) => {
                    const isActive = daysFilter === value;
                    return (
                        <Pressable
                            key={value}
                            onPress={() => { setDaysFilter(value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Revenue Card */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Revenue Trends</Text>
                            <View style={styles.trendIconBox}>
                                <TrendingUp size={16} color={Colors.primary} strokeWidth={2} />
                            </View>
                        </View>
                        <Text style={styles.totalRevLabel}>TOTAL REVENUE</Text>
                        <Text style={styles.totalRevValue}>₹{totalRevenue.toLocaleString()}</Text>
                        <BarChart data={analytics?.revenueTrends ?? []} />
                    </Animated.View>

                    {/* Top Services */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Top Services</Text>
                            <View style={[styles.trendIconBox, { backgroundColor: '#EEF2FF' }]}>
                                <Briefcase size={16} color="#6366F1" strokeWidth={2} />
                            </View>
                        </View>
                        {!analytics?.topServices.length ? (
                            <Text style={styles.emptyText}>No services booked yet.</Text>
                        ) : (
                            analytics.topServices.map((s, i) => (
                                <ServiceRow key={s.id} rank={i + 1} name={s.name} count={s.count}
                                    revenue={s.revenue} maxRevenue={analytics.topServices[0].revenue} />
                            ))
                        )}
                    </Animated.View>

                    {/* Agent Leaderboard */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Agent Leaderboard</Text>
                            <View style={[styles.trendIconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Users size={16} color="#10B981" strokeWidth={2} />
                            </View>
                        </View>
                        {!analytics?.topAgents.length ? (
                            <Text style={styles.emptyText}>No agent data available.</Text>
                        ) : (
                            analytics.topAgents.map((a, i) => (
                                <AgentRow key={a.id} rank={i + 1} name={a.name}
                                    rating={a.rating} completedJobs={a.completedJobs} />
                            ))
                        )}
                    </Animated.View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    filterBar: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.sm },
    filterChip: {
        flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9',
    },
    filterChipActive: {
        backgroundColor: Colors.primary, borderColor: Colors.primary,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    filterText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    filterTextActive: { color: '#FFF' },

    scroll: { padding: Spacing.lg, gap: 12, paddingBottom: 40 },

    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    trendIconBox: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primary + '12',
        justifyContent: 'center', alignItems: 'center',
    },
    totalRevLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.8 },
    totalRevValue: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginTop: 2, marginBottom: 16 },
    emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

    // Bar Chart
    chartRoot: { height: 160 },
    barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    barGroup: { alignItems: 'center', flex: 1 },
    barTrack: {
        width: 10, height: 120, backgroundColor: '#F1F5F9', borderRadius: 5,
        justifyContent: 'flex-end', overflow: 'hidden',
    },
    barFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
    barLabel: { fontSize: 8, color: '#94A3B8', fontWeight: '600', marginTop: 6, transform: [{ rotate: '-45deg' }], height: 18 },
    emptyChart: { height: 130, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyChartText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

    // Services
    serviceRow: { marginBottom: 14 },
    serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    serviceRankBox: {
        width: 28, height: 28, borderRadius: 10, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    serviceRankText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    serviceName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    serviceCount: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
    serviceRevenue: { fontSize: 14, fontWeight: '800', color: '#6366F1' },
    progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },

    // Agents
    agentRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    },
    agentRankBox: {
        width: 30, height: 30, borderRadius: 10, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    agentRankText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
    agentName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    agentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    agentMetaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#E2E8F0' },
});
