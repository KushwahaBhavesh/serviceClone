import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    User,
    Calendar,
    IndianRupee,
    X,
    Check,
    ClipboardList,
    Package,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';
import type { Booking } from '../../../lib/marketplace';
import { useToast } from '../../../context/ToastContext';
import EmptyState from '../../../components/shared/EmptyState';

type TabKey = 'PENDING' | 'ACTIVE' | 'COMPLETED';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'PENDING', label: 'Requests', icon: <ClipboardList size={14} color="currentColor" /> },
    { key: 'ACTIVE', label: 'Active', icon: <Package size={14} color="currentColor" /> },
    { key: 'COMPLETED', label: 'History', icon: <Check size={14} color="currentColor" /> },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#F59E0B',
    ACCEPTED: '#6366F1',
    AGENT_ASSIGNED: '#8B5CF6',
    EN_ROUTE: '#0EA5E9',
    ARRIVED: '#F97316',
    IN_PROGRESS: Colors.primary,
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444',
    REJECTED: '#94A3B8',
};

function getStatusFilter(tab: TabKey): string | undefined {
    if (tab === 'PENDING') return 'PENDING';
    if (tab === 'COMPLETED') return 'COMPLETED';
    return undefined;
}

export default function MerchantJobsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showError } = useToast();
    const [activeTab, setActiveTab] = useState<TabKey>('PENDING');
    const [orders, setOrders] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const status = getStatusFilter(activeTab);
            const response = await merchantApi.listOrders({ status, limit: 50 });
            let result = response.data.orders;
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

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );
    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleAccept = async (id: string) => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await merchantApi.acceptOrder(id);
            fetchOrders();
        } catch { showError('Failed to accept order'); }
    };

    const handleReject = async (id: string) => {
        Alert.alert('Reject Order', 'Are you sure you want to reject this order?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive',
                onPress: async () => {
                    try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        await merchantApi.rejectOrder(id);
                        fetchOrders();
                    } catch { showError('Failed to reject order'); }
                },
            },
        ]);
    };

    const renderOrderCard = useCallback(({ item, index }: { item: Booking; index: number }) => {
        const statusColor = STATUS_COLORS[item.status] || '#94A3B8';
        const animDelay = Math.min(index, 8) * 60;

        return (
            <Animated.View entering={FadeInDown.delay(animDelay).springify()}>
                <Pressable
                    style={({ pressed }) => [styles.orderCard, pressed && { transform: [{ scale: 0.98 }] }]}
                    onPress={() => router.push(`/(merchant)/orders/${item.id}` as any)}
                >
                    <View style={[styles.orderAccent, { backgroundColor: statusColor }]} />

                    <View style={styles.orderContent}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderNumber}>{item.bookingNumber}</Text>
                            <View style={[styles.statusPill, { backgroundColor: statusColor + '12' }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {item.status.replace(/_/g, ' ')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.orderBody}>
                            {item.customer && (
                                <View style={styles.infoRow}>
                                    <User size={13} color="#94A3B8" strokeWidth={2} />
                                    <Text style={styles.infoText}>{item.customer.name || 'Customer'}</Text>
                                </View>
                            )}
                            <View style={styles.infoRow}>
                                <Calendar size={13} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.infoText}>
                                    {new Date(item.scheduledAt).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <IndianRupee size={13} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.priceText}>₹{(item.total ?? 0).toLocaleString()}</Text>
                            </View>
                        </View>

                        {item.items && item.items.length > 0 && (
                            <View style={styles.chipRow}>
                                {item.items.map((bi) => (
                                    <View key={bi.id} style={styles.serviceChip}>
                                        <Text style={styles.serviceChipText}>
                                            {bi.service?.name ?? 'Service'} × {bi.quantity}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {item.status === 'PENDING' && (
                            <View style={styles.actionRow}>
                                <Pressable
                                    onPress={() => handleReject(item.id)}
                                    style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }]}
                                >
                                    <X size={15} color="#EF4444" strokeWidth={2.5} />
                                    <Text style={styles.rejectText}>Reject</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleAccept(item.id)}
                                    style={({ pressed }) => [styles.acceptBtn, pressed && { transform: [{ scale: 0.96 }] }]}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, '#FF8533']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.acceptGradient}
                                    >
                                        <Check size={15} color="#FFF" strokeWidth={2.5} />
                                        <Text style={styles.acceptText}>Accept</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, [handleAccept, handleReject, router]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={styles.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.headerTitle}>Orders</Text>
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{orders.length} TOTAL</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { marginTop: insets.top + 70 }]}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <Pressable
                            key={tab.key}
                            onPress={() => { setActiveTab(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={[styles.tab, isActive && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* List */}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            progressViewOffset={insets.top + 60}
                        />
                    }
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={8}
                    ListEmptyComponent={
                        <EmptyState
                            icon="briefcase-outline"
                            title={`No ${activeTab.toLowerCase()} orders`}
                            subtitle="Share your services to start receiving bookings"
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
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    // Header
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    tabBadge: {
        backgroundColor: Colors.primary + '12',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 0.5,
    },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activeTab: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },
    activeTabText: {
        color: '#FFF',
    },

    // List
    list: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 120,
        gap: 12,
    },

    // Card
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        flexDirection: 'row',
    },
    orderAccent: {
        width: 4,
    },
    orderContent: {
        flex: 1,
        padding: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    orderBody: { gap: 8 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    priceText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '900',
    },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12,
    },
    serviceChip: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    serviceChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },

    // Actions
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
        gap: 6,
    },
    rejectText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#EF4444',
    },
    acceptBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    acceptText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFF',
    },

    // Empty
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 8,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#334155',
    },
    emptyHint: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
