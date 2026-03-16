import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../lib/api';
import { AnalyticsDashboard } from '../../lib/merchant';

const MERCHANT = '/api/v1/merchant';

type FilterDays = 7 | 30 | 90;
const FILTERS: { value: FilterDays; label: string }[] = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
];

// ─── Mini Bar Chart ──────────────────────────────────────────────────────────

interface BarChartProps {
    data: { date: string; amount: number }[];
}

function BarChart({ data }: BarChartProps) {
    if (data.length === 0) {
        return (
            <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={36} color={Colors.border} />
                <Text style={styles.emptyChartText}>No revenue data for this period.</Text>
            </View>
        );
    }

    const maxAmount = Math.max(...data.map(d => d.amount));
    const displayData = data.length > 20
        ? data.filter((_, i) => i % Math.ceil(data.length / 14) === 0)
        : data;

    return (
        <View style={styles.chartRoot}>
            <View style={styles.barsRow}>
                {displayData.map((item, i) => {
                    const heightPct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    const d = new Date(item.date);
                    const label = `${d.getDate()}/${d.getMonth() + 1}`;
                    return (
                        <View key={i} style={styles.barGroup}>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { height: `${heightPct}%` as any }]} />
                            </View>
                            <Text style={styles.barLabel}>{label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Service Row ─────────────────────────────────────────────────────────────

interface ServiceRowProps {
    rank: number;
    name: string;
    count: number;
    revenue: number;
    maxRevenue: number;
}

function ServiceRow({ rank, name, count, revenue, maxRevenue }: ServiceRowProps) {
    const widthPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
    return (
        <View style={styles.serviceRow}>
            <View style={styles.rowHeaderLine}>
                <Text style={styles.serviceRank}>{rank}.</Text>
                <Text style={styles.serviceName} numberOfLines={1}>{name}</Text>
                <Text style={styles.serviceRevenue}>₹{revenue.toLocaleString()}</Text>
            </View>
            <Text style={styles.serviceCount}>{count} booking{count !== 1 ? 's' : ''}</Text>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${widthPct}%` as any }]} />
            </View>
        </View>
    );
}

// ─── Agent Row ───────────────────────────────────────────────────────────────

interface AgentRowProps {
    rank: number;
    name: string;
    rating: number;
    completedJobs: number;
}

function AgentRow({ rank, name, rating, completedJobs }: AgentRowProps) {
    return (
        <View style={styles.agentRow}>
            <View style={styles.agentRank}>
                <Text style={styles.agentRankText}>{rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{name}</Text>
                <View style={styles.agentMeta}>
                    <Ionicons name="briefcase-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.agentMetaText}>{completedJobs} jobs</Text>
                    <View style={styles.dot} />
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.agentMetaText}>{rating.toFixed(1)}</Text>
                </View>
            </View>
        </View>
    );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MerchantAnalyticsScreen() {
    const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [daysFilter, setDaysFilter] = useState<FilterDays>(30);

    const totalRevenue = analytics?.revenueTrends.reduce((sum, item) => sum + item.amount, 0) ?? 0;

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await api.get<{ analytics: AnalyticsDashboard }>(
                MERCHANT + '/analytics',
                { params: { days: daysFilter } },
            );
            setAnalytics(res.data.analytics);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [daysFilter]);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Analytics',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />

            {/* Period Filter */}
            <View style={styles.filterBar}>
                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {FILTERS.map(({ value, label }) => (
                        <TouchableOpacity
                            key={value}
                            style={[styles.chip, daysFilter === value && styles.chipActive]}
                            onPress={() => setDaysFilter(value)}
                        >
                            <Text style={[styles.chipText, daysFilter === value && styles.chipTextActive]}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Revenue Card */}
                    <View style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Revenue Trends</Text>
                            <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.totalRevLabel}>Total Revenue</Text>
                        <Text style={styles.totalRevValue}>₹{totalRevenue.toLocaleString()}</Text>
                        <BarChart data={analytics?.revenueTrends ?? []} />
                    </View>

                    {/* Top Services */}
                    <View style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Top Performing Services</Text>
                            <Ionicons name="briefcase-outline" size={20} color={Colors.secondary} />
                        </View>
                        {!analytics?.topServices.length ? (
                            <Text style={styles.emptyText}>No services booked yet.</Text>
                        ) : (
                            analytics.topServices.map((s, i) => (
                                <ServiceRow
                                    key={s.id}
                                    rank={i + 1}
                                    name={s.name}
                                    count={s.count}
                                    revenue={s.revenue}
                                    maxRevenue={analytics.topServices[0].revenue}
                                />
                            ))
                        )}
                    </View>

                    {/* Agent Leaderboard */}
                    <View style={styles.card}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Agent Leaderboard</Text>
                            <Ionicons name="people-outline" size={20} color={Colors.primary} />
                        </View>
                        {!analytics?.topAgents.length ? (
                            <Text style={styles.emptyText}>No agent data available.</Text>
                        ) : (
                            analytics.topAgents.map((a, i) => (
                                <AgentRow
                                    key={a.id}
                                    rank={i + 1}
                                    name={a.name}
                                    rating={a.rating}
                                    completedJobs={a.completedJobs}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBtn: { paddingHorizontal: Spacing.sm },

    // Filter bar
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterScroll: { marginLeft: Spacing.sm },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: Spacing.sm,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    chipTextActive: { color: Colors.textOnPrimary },

    // Layout
    scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    totalRevLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    totalRevValue: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.md },

    // Bar chart
    chartRoot: { height: 160 },
    barsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    barGroup: { alignItems: 'center', flex: 1 },
    barTrack: {
        width: 8,
        height: 120,
        backgroundColor: Colors.border,
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    barLabel: { fontSize: 8, color: Colors.textMuted, marginTop: 6, transform: [{ rotate: '-45deg' }], height: 18 },
    emptyChart: { height: 130, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    emptyChartText: { fontSize: FontSize.sm, color: Colors.textMuted },

    // Services
    serviceRow: { marginBottom: Spacing.md },
    rowHeaderLine: { flexDirection: 'row', alignItems: 'center' },
    serviceRank: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, width: 20 },
    serviceName: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    serviceRevenue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.secondary },
    serviceCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginLeft: 20, marginBottom: 6 },
    progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginLeft: 20, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 3 },

    // Agents
    agentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.sm,
    },
    agentRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentRankText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
    agentName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    agentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    agentMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
});
