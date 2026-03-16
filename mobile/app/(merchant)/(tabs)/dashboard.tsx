import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantDashboard } from '../../../lib/merchant';
import type { Agent } from '../../../lib/merchant';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
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
                merchantApi.getAgentStatusGrid()
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

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
                <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                    <Text style={styles.greeting}>Business Dashboard</Text>
                    <View style={styles.verificationBadge}>
                        <Ionicons
                            name={dashboard?.verificationStatus === 'APPROVED' ? 'checkmark-circle' : 'time'}
                            size={16}
                            color={dashboard?.verificationStatus === 'APPROVED' ? Colors.success : Colors.warning}
                        />
                        <Text style={[styles.badgeText, {
                            color: dashboard?.verificationStatus === 'APPROVED' ? Colors.success : Colors.warning,
                        }]}>
                            {dashboard?.verificationStatus === 'APPROVED' ? 'Verified' : 'Pending'}
                        </Text>
                    </View>
                </View>

                {/* KPI Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="cash"
                        label="Today's Revenue"
                        value={`₹${(dashboard?.todayRevenue ?? 0).toLocaleString()}`}
                        color={Colors.success}
                    />
                    <StatCard
                        icon="flash"
                        label="Active Orders"
                        value={dashboard?.activeOrders ?? 0}
                        color={Colors.primary}
                    />
                    <StatCard
                        icon="hourglass"
                        label="Pending"
                        value={dashboard?.pendingOrders ?? 0}
                        color={Colors.warning}
                    />
                    <StatCard
                        icon="people"
                        label="Agents"
                        value={dashboard?.agentCount ?? 0}
                        color={Colors.secondary}
                    />
                </View>

                {/* Rating Card */}
                <View style={styles.ratingCard}>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={28} color="#FFC107" />
                        <Text style={styles.ratingValue}>{(dashboard?.rating ?? 0).toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>({dashboard?.totalReviews ?? 0} reviews)</Text>
                    </View>
                    <Text style={styles.ratingSubtext}>Average customer rating</Text>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionQuickActionsTitle}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRowScroll}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/catalog')}>
                        <Ionicons name="list" size={24} color={Colors.primary} />
                        <Text style={styles.actionText}>Services</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/agents')}>
                        <Ionicons name="people" size={24} color={Colors.secondary} />
                        <Text style={styles.actionText}>Agents</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/agents/map')}>
                        <Ionicons name="map" size={24} color={Colors.warning} />
                        <Text style={styles.actionText}>Live Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/schedule')}>
                        <Ionicons name="calendar" size={24} color="#00BCD4" />
                        <Text style={styles.actionText}>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/earnings')}>
                        <Ionicons name="cash" size={24} color={Colors.success} />
                        <Text style={styles.actionText}>Earnings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/promotions')}>
                        <Ionicons name="pricetag" size={24} color="#E91E63" />
                        <Text style={styles.actionText}>Promotions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(merchant)/analytics')}>
                        <Ionicons name="analytics" size={24} color="#9C27B0" />
                        <Text style={styles.actionText}>Analytics</Text>
                    </TouchableOpacity>
                </ScrollView>


                {/* Agent Status Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Agent Status</Text>
                    <TouchableOpacity onPress={() => router.push('/(merchant)/agents/map')}>
                        <Text style={styles.linkText}>View Map</Text>
                    </TouchableOpacity>
                </View>

                {agents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No agents active.</Text>
                    </View>
                ) : (
                    <View style={styles.agentGrid}>
                        {agents.map((agent) => {
                            const isBusy = agent.bookings && agent.bookings.length > 0;
                            const isOffline = agent.status === 'OFFLINE';
                            return (
                                <TouchableOpacity key={agent.id} style={styles.agentCard} onPress={() => router.push(`/(merchant)/agents/${agent.id}`)}>
                                    <View style={styles.agentAvatarContainer}>
                                        <Text style={styles.agentAvatarText}>
                                            {agent.user?.name?.charAt(0) || 'A'}
                                        </Text>
                                        <View style={[
                                            styles.agentStatusIndicator,
                                            { backgroundColor: isOffline ? Colors.border : (isBusy ? Colors.warning : Colors.success) }
                                        ]} />
                                    </View>
                                    <View style={styles.agentInfo}>
                                        <Text style={styles.agentName} numberOfLines={1}>{agent.user?.name}</Text>
                                        <Text style={styles.agentStatusText}>
                                            {isOffline ? 'Offline' : (isBusy ? `Job #${agent.bookings![0].bookingNumber}` : 'Available')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Today's Orders Stats */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Orders</Text>
                        <Text style={styles.summaryValue}>{dashboard?.todayOrders ?? 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Active Orders</Text>
                        <Text style={styles.summaryValue}>{dashboard?.activeOrders ?? 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Pending Approval</Text>
                        <Text style={[styles.summaryValue, { color: Colors.warning }]}>{dashboard?.pendingOrders ?? 0}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundAlt },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        // paddingTop: Spacing.md, // This will be overridden by inline style
        paddingBottom: Spacing.sm,
    },
    greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    badgeText: { fontSize: FontSize.xs, fontWeight: '600' },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    statCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        width: '47%',
        flexGrow: 1,
        borderLeftWidth: 3,
        gap: Spacing.xs,
    },
    statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginTop: 4 },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },

    ratingCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        alignItems: 'center',
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    ratingValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    ratingCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
    ratingSubtext: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        // paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },

    sectionQuickActionsTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },


    actionsRowScroll: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: Spacing.md,
    },
    actionButton: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        gap: 8,
    },
    actionText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text },

    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    summaryTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    summaryValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },

    // Agent Grid Styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    linkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: Spacing.xl },
    emptyStateText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    agentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    agentCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    agentAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    agentAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
    agentStatusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
        bottom: 0,
        right: -2,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    agentInfo: { flex: 1 },
    agentName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    agentStatusText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
