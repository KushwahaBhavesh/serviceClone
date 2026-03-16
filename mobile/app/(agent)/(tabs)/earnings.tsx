import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { agentApi, AgentJob } from '../../../lib/agent';

export default function AgentEarningsScreen() {
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState<AgentJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, count: 0 });

    const fetchHistory = useCallback(async () => {
        try {
            const { data } = await agentApi.getHistory();
            setHistory(data.jobs);

            // Calculate simple stats
            const total = data.jobs.reduce((acc, job) => acc + (job.total || 0), 0);
            setStats({ total, count: data.pagination.total });
        } catch (error) {
            console.error('Error fetching earnings history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderTransaction = ({ item }: { item: AgentJob }) => (
        <View style={styles.transactionCard}>
            <View style={styles.iconWrapper}>
                <Ionicons name="cash-outline" size={24} color={Colors.success} />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Job #{item.bookingNumber}</Text>
                <Text style={styles.transactionDate}>
                    {new Date(item.completedAt || item.scheduledAt).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.transactionAmount}>+${(item.total || 0).toFixed(2)}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <Text style={styles.title}>Earnings</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Earnings</Text>
                    <Text style={styles.summaryValue}>${stats.total.toFixed(2)}</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryStat}>
                            <Text style={styles.statLabel}>Jobs Done</Text>
                            <Text style={styles.statValue}>{stats.count}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryStat}>
                            <Text style={styles.statLabel}>Avg / Job</Text>
                            <Text style={styles.statValue}>
                                ${stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* History Section */}
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Recent Payouts</Text>
                </View>

                {history.length > 0 ? (
                    history.map(item => (
                        <View key={item.id}>
                            {renderTransaction({ item })}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No earnings history yet.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: Spacing.lg, paddingBottom: Spacing.md },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    content: { padding: Spacing.lg },

    summaryCard: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '600' },
    summaryValue: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: Spacing.xs },
    summaryRow: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        width: '100%'
    },
    summaryStat: { flex: 1, alignItems: 'center' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700', marginTop: 4 },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    historyHeader: { marginBottom: Spacing.md },
    historyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.success + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: { flex: 1, marginLeft: Spacing.md },
    transactionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    transactionDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    transactionAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.success },

    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: Colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.md },
});
