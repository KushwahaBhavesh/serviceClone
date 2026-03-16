import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { agentApi, AgentJob } from '../../../lib/agent';

type TabKey = 'ACTIVE' | 'UPCOMING' | 'HISTORY';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'ACTIVE', label: 'Active' },
    { key: 'UPCOMING', label: 'Upcoming' },
    { key: 'HISTORY', label: 'History' },
];

const STATUS_COLORS: Record<string, string> = {
    ACCEPTED: Colors.secondary,
    AGENT_ASSIGNED: '#9C27B0',
    EN_ROUTE: '#00BCD4',
    ARRIVED: '#FF9800',
    IN_PROGRESS: Colors.primary,
    COMPLETED: Colors.success,
    CANCELLED: Colors.error,
    REJECTED: Colors.textMuted,
};

export default function AgentJobsScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabKey>('ACTIVE');
    const [jobs, setJobs] = useState<AgentJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchJobs = useCallback(async () => {
        try {
            if (activeTab === 'HISTORY') {
                const response = await agentApi.getHistory();
                setJobs(response.data.jobs);
            } else {
                const response = await agentApi.getJobs();
                if (activeTab === 'ACTIVE') {
                    setJobs(response.data.activeJobs);
                } else {
                    setJobs(response.data.upcomingJobs);
                }
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setLoading(true);
        fetchJobs();
    }, [fetchJobs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const renderJobCard = ({ item }: { item: AgentJob }) => (
        <TouchableOpacity
            style={styles.jobCard}
            onPress={() => router.push(`/(agent)/jobs/${item.id}`)}
        >
            <View style={styles.jobHeader}>
                <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                        {item.status.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            <View style={styles.jobInfo}>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText}>
                        {new Date(item.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {item.address?.line1}, {item.address?.city}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText}>{item.customer?.name || 'Customer'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.jobFooter}>
                <Text style={styles.serviceCount}>
                    {item.items?.length || 0} {(item.items?.length || 0) === 1 ? 'service' : 'services'}
                </Text>
                <Text style={styles.totalAmount}>${(item.total || 0).toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <Text style={styles.title}>Job Queue</Text>
            </View>

            <View style={styles.tabBar}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key && styles.activeTabLabel,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={Colors.border} />
                            <Text style={styles.emptyTitle}>No Jobs Found</Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'ACTIVE'
                                    ? "You don't have any active jobs right now."
                                    : activeTab === 'UPCOMING'
                                        ? "No upcoming jobs assigned yet."
                                        : "You haven't completed any jobs yet."
                                }
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { padding: Spacing.lg, paddingBottom: Spacing.md },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        paddingVertical: Spacing.md,
        marginRight: Spacing.xl,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: Colors.primary },
    tabLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted },
    activeTabLabel: { color: Colors.primary },
    listContent: { padding: Spacing.lg },
    jobCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    bookingNumber: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    jobInfo: { gap: Spacing.xs },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceCount: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
    totalAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
    emptySubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.xl
    },
});
