import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { bookingApi, type Booking } from '../../lib/marketplace';

type TabKey = 'upcoming' | 'past';

const STATUS_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    PENDING: { color: '#F59E0B', icon: 'time', label: 'Pending' },
    ACCEPTED: { color: '#3B82F6', icon: 'checkmark-circle', label: 'Accepted' },
    IN_PROGRESS: { color: Colors.primary, icon: 'construct', label: 'In Progress' },
    COMPLETED: { color: Colors.success, icon: 'checkmark-done-circle', label: 'Completed' },
    CANCELLED: { color: Colors.error, icon: 'close-circle', label: 'Cancelled' },
    REJECTED: { color: '#6B7280', icon: 'ban', label: 'Rejected' },
};

export default function BookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reorderingId, setReorderingId] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await bookingApi.listBookings();
            setBookings(data.bookings);
        } catch { /* silent */ }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    const upcomingStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];
    const filtered = bookings.filter(b =>
        activeTab === 'upcoming'
            ? upcomingStatuses.includes(b.status)
            : !upcomingStatuses.includes(b.status),
    );

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderBookingCard = ({ item }: { item: Booking }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
        const serviceNames = item.items?.map(i => i.service?.name).filter(Boolean).join(', ') || 'Service';

        return (
            <Pressable
                style={styles.bookingCard}
                onPress={() => {
                    const isActive = ['ACCEPTED', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(item.status);
                    if (isActive) {
                        router.push(`/(booking)/tracking/${item.id}` as any);
                    } else {
                        router.push(`/(booking)/${item.id}` as any);
                    }
                }}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '18' }]}>
                        <Ionicons name={config.icon} size={14} color={config.color} />
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                <Text style={styles.serviceNames} numberOfLines={1}>{serviceNames}</Text>

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{formatDate(item.scheduledAt)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{formatTime(item.scheduledAt)}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.addressLabel}>
                        {item.address?.label || 'Address'} · {item.address?.city || ''}
                    </Text>
                    <Text style={styles.totalPrice}>₹{item.total.toFixed(0)}</Text>
                </View>

                {/* Re-order button for completed/past */}
                {item.status === 'COMPLETED' && (
                    <Pressable
                        style={styles.reorderBtn}
                        onPress={async (e) => {
                            e.stopPropagation();
                            setReorderingId(item.id);
                            try {
                                await bookingApi.reorderBooking(item);
                                router.push('/(booking)/confirmation' as any);
                            } catch (err: any) {
                                console.error('Reorder failed:', err);
                            } finally {
                                setReorderingId(null);
                            }
                        }}
                        disabled={reorderingId === item.id}
                    >
                        {reorderingId === item.id ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="refresh" size={16} color={Colors.primary} />
                                <Text style={styles.reorderText}>Book Again</Text>
                            </>
                        )}
                    </Pressable>
                )}
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Text style={styles.screenTitle}>My Bookings</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {(['upcoming', 'past'] as TabKey[]).map((tab) => (
                    <Pressable
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="calendar-outline" size={56} color={Colors.border} />
                    <Text style={styles.emptyTitle}>
                        No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {activeTab === 'upcoming'
                            ? 'Book a service from the Explore tab!'
                            : 'Your completed bookings will appear here.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderBookingCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    screenTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundAlt,
        alignItems: 'center',
    },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
    tabTextActive: { color: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    bookingCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookingNumber: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    statusText: { fontSize: FontSize.xs, fontWeight: '700' },
    serviceNames: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    cardMeta: { flexDirection: 'row', gap: Spacing.lg },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    addressLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    totalPrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
});
