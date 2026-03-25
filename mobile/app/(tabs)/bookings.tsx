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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
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
    const insets = useSafeAreaInsets();
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
        <View style={styles.container}>
            <Text style={[styles.screenTitle, { paddingTop: insets.top + Spacing.md }]}>My Bookings</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {(['upcoming', 'past'] as TabKey[]).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <Pressable
                            key={tab}
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                            </Text>
                        </Pressable>
                    );
                })}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    screenTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: 24,
        padding: 4,
        marginBottom: Spacing.lg,
        position: 'relative',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        zIndex: 1,
    },
    tabActive: { 
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    tabText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    tabTextActive: { color: Colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 160, gap: Spacing.md },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 24, // Consistent premium rounding
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        padding: Spacing.lg,
        gap: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookingNumber: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
    },
    statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    serviceNames: { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    cardMeta: { flexDirection: 'row', gap: Spacing.lg, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    cardFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 8,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    addressLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
    totalPrice: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
    reorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: Colors.primary + '08',
        borderRadius: 24,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.primary + '15',
    },
    reorderText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },
});
