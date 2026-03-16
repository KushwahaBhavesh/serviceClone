import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { Booking } from '../../lib/marketplace';

type TabKey = 'PENDING' | 'ACTIVE' | 'COMPLETED';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'PENDING', label: 'Requests' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'History' },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: Colors.warning,
    ACCEPTED: Colors.secondary,
    AGENT_ASSIGNED: '#9C27B0',
    EN_ROUTE: '#00BCD4',
    ARRIVED: '#FF9800',
    IN_PROGRESS: Colors.primary,
    COMPLETED: Colors.success,
    CANCELLED: Colors.error,
    REJECTED: Colors.textMuted,
};

function getStatusFilter(tab: TabKey): string | undefined {
    if (tab === 'PENDING') return 'PENDING';
    if (tab === 'COMPLETED') return 'COMPLETED';
    return undefined; // Active shows all non-terminal statuses via API
}

export default function MerchantJobsScreen() {
    const [activeTab, setActiveTab] = useState<TabKey>('PENDING');
    const [orders, setOrders] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const status = getStatusFilter(activeTab);
            const response = await merchantApi.listOrders({ status, limit: 50 });
            let result = response.data.orders;

            // For "Active" tab, filter to non-terminal statuses on the client
            if (activeTab === 'ACTIVE') {
                result = result.filter((o: Booking) =>
                    ['ACCEPTED', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(o.status),
                );
            }
            setOrders(result);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setLoading(true);
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleAccept = async (id: string) => {
        try {
            await merchantApi.acceptOrder(id);
            fetchOrders();
        } catch { Alert.alert('Error', 'Failed to accept order'); }
    };

    const handleReject = async (id: string) => {
        Alert.alert('Reject Order', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try { await merchantApi.rejectOrder(id); fetchOrders(); }
                    catch { Alert.alert('Error', 'Failed to reject order'); }
                },
            },
        ]);
    };

    const renderOrderCard = ({ item }: { item: Booking }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{item.bookingNumber}</Text>
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
            </View>

            <View style={styles.orderBody}>
                {item.customer && (
                    <View style={styles.infoRow}>
                        <Ionicons name="person" size={14} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>{item.customer.name || 'Customer'}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{new Date(item.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="pricetag" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>₹{item.total.toLocaleString()}</Text>
                </View>
                {item.items?.map((bi) => (
                    <Text key={bi.id} style={styles.serviceChip}>
                        {bi.service?.name ?? 'Service'} × {bi.quantity}
                    </Text>
                ))}
            </View>

            {item.status === 'PENDING' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                        <Ionicons name="close" size={18} color={Colors.error} />
                        <Text style={[styles.btnText, { color: Colors.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                        <Ionicons name="checkmark" size={18} color={Colors.textOnPrimary} />
                        <Text style={[styles.btnText, { color: Colors.textOnPrimary }]}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Job Queue</Text>

            <View style={styles.tabBar}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="clipboard" size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

    tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
    tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.full, backgroundColor: Colors.surface },
    activeTab: { backgroundColor: Colors.primary },
    tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    activeTabText: { color: Colors.textOnPrimary },

    list: { padding: Spacing.md, gap: Spacing.sm },

    orderCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    orderNumber: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
    statusText: { fontSize: FontSize.xs, fontWeight: '700' },

    orderBody: { gap: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    infoLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    serviceChip: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: 4,
    },

    actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.error,
        gap: 4,
    },
    acceptBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.success,
        gap: 4,
    },
    btnText: { fontSize: FontSize.sm, fontWeight: '700' },

    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
