import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
    ChevronLeft, Clock, CheckCircle, XCircle, IndianRupee,
    Calendar, Filter,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing } from '../../constants/theme';
import { agentApi, AgentJob } from '../../lib/agent';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/shared/EmptyState';

type FilterStatus = 'ALL' | 'COMPLETED' | 'CANCELLED';
const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    COMPLETED: { color: '#22C55E', bg: '#F0FDF4', icon: CheckCircle },
    CANCELLED: { color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
    NO_SHOW: { color: '#F59E0B', bg: '#FFFBEB', icon: XCircle },
};

export default function JobHistoryScreen() {
    const insets = useSafeAreaInsets();
    const { showError } = useToast();

    const [jobs, setJobs] = useState<AgentJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchHistory = useCallback(async (p = 1, reset = true) => {
        try {
            const { data } = await agentApi.getHistory({ page: p, limit: 20 });
            const newJobs = data.jobs ?? [];
            setJobs(prev => reset ? newJobs : [...prev, ...newJobs]);
            setHasMore(p < (data.pagination?.totalPages ?? 1));
            setPage(p);
        } catch { showError('Failed to load history'); }
        finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

    const onRefresh = () => { setRefreshing(true); fetchHistory(1, true); };
    const onEndReached = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        fetchHistory(page + 1, false);
    };

    const filteredJobs = filter === 'ALL'
        ? jobs
        : jobs.filter(j => j.status === filter);

    const renderJob = useCallback(({ item, index }: { item: AgentJob; index: number }) => {
        const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.COMPLETED;
        const Icon = config.icon;
        const date = new Date(item.scheduledAt);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 50).springify()}>
                <Pressable
                    onPress={() => router.push(`/(agent)/jobs/${item.id}` as any)}
                    style={({ pressed }) => [styles.jobCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                >
                    <View style={styles.jobHeader}>
                        <View style={styles.jobTitleRow}>
                            <Text style={styles.jobNumber}>#{item.bookingNumber}</Text>
                            <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
                                <Icon size={12} color={config.color} strokeWidth={2.5} />
                                <Text style={[styles.statusText, { color: config.color }]}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.jobService} numberOfLines={1}>
                            {item.items?.map(i => i.service?.name).filter(Boolean).join(', ') || 'Service'}
                        </Text>
                    </View>

                    <View style={styles.jobDivider} />

                    <View style={styles.jobMeta}>
                        <View style={styles.jobMetaItem}>
                            <Calendar size={12} color="#94A3B8" strokeWidth={2} />
                            <Text style={styles.jobMetaText}>{dateStr}</Text>
                        </View>
                        <View style={styles.jobMetaItem}>
                            <Clock size={12} color="#94A3B8" strokeWidth={2} />
                            <Text style={styles.jobMetaText}>{new Date(item.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={styles.jobMetaItem}>
                            <IndianRupee size={12} color="#94A3B8" strokeWidth={2} />
                            <Text style={styles.jobMetaText}>₹{item.total?.toFixed(0) ?? '0'}</Text>
                        </View>
                    </View>

                    {item.customer?.name && (
                        <View style={styles.customerRow}>
                            <View style={styles.customerAvatar}>
                                <Text style={styles.customerInitial}>
                                    {item.customer.name[0]?.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.customerName}>{item.customer.name}</Text>
                        </View>
                    )}
                </Pressable>
            </Animated.View>
        );
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Job History</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                    >
                        <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    renderItem={renderJob}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={10}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color={Colors.primary} /> : null}
                    ListEmptyComponent={
                        <EmptyState
                            icon="newspaper-outline"
                            title="No job history yet"
                            subtitle="Completed and cancelled jobs will appear here"
                        />
                    }
                />
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
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    filterRow: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: Spacing.lg, paddingVertical: 12,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    filterPill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    },
    filterPillActive: { backgroundColor: Colors.primary + '14', borderColor: Colors.primary },
    filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    filterTextActive: { color: Colors.primary, fontWeight: '700' },

    list: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },

    jobCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    jobHeader: { marginBottom: 12 },
    jobTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    jobNumber: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    jobService: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    jobDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },

    jobMeta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
    jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    jobMetaText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    customerAvatar: {
        width: 28, height: 28, borderRadius: 10,
        backgroundColor: Colors.primary + '14', justifyContent: 'center', alignItems: 'center',
    },
    customerInitial: { fontSize: 12, fontWeight: '800', color: Colors.primary },
    customerName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
});
