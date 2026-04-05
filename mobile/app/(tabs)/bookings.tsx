import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeInRight,
} from 'react-native-reanimated';
import {
    Calendar,
    Clock,
    ChevronRight,
    CheckCircle2,
    Timer,
    XCircle,
    Ban,
    RefreshCw,
    Search,
    Sparkles,
    Navigation2,
    ShieldCheck,
    MapPin
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { bookingApi, type Booking } from '../../lib/marketplace';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

type TabKey = 'upcoming' | 'past';

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
    PENDING: { color: '#AAAAAA', icon: Timer, label: 'AWAITING' },
    ACCEPTED: { color: Colors.primary, icon: CheckCircle2, label: 'CONFIRMED' },
    IN_PROGRESS: { color: Colors.primary, icon: ZapIcon, label: 'IN PROGRESS' },
    COMPLETED: { color: Colors.primary, icon: CheckCircle2, label: 'COMPLETED' },
    CANCELLED: { color: '#AAAAAA', icon: XCircle, label: 'CANCELLED' },
    REJECTED: { color: '#AAAAAA', icon: Ban, label: 'REJECTED' },
};

function ZapIcon(props: any) {
    return <Sparkles {...props} />;
}

export default function BookingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError } = useToast();

    const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reorderingId, setReorderingId] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        try {
            const { data } = await bookingApi.listBookings();
            setBookings(data.bookings);
        } catch { /* silent */ }
        finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const upcomingStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED'];
    const filtered = bookings.filter(b =>
        activeTab === 'upcoming'
            ? upcomingStatuses.includes(b.status)
            : !upcomingStatuses.includes(b.status),
    );

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderBookingCard = ({ item, index }: { item: Booking, index: number }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
        const serviceNames = item.items?.map(i => i.service?.name).filter(Boolean).join(', ') || 'Service';
        const isActive = ['ACCEPTED', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(item.status);

        return (
            <Animated.View entering={FadeInUp.delay(100 + index * 50).springify()}>
                <Pressable
                    style={({ pressed }) => [
                        styles.bookingCard,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        if (isActive) {
                            router.push(`/(booking)/tracking/${item.id}` as any);
                        } else {
                            router.push(`/(booking)/${item.id}` as any);
                        }
                    }}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.idBox}>
                            <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.color + '10' }]}>
                            <config.icon size={12} color={config.color} strokeWidth={3} />
                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                    </View>

                    <Text style={styles.serviceTitle} numberOfLines={1}>{serviceNames.toUpperCase()}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#94A3B8" strokeWidth={2.5} />
                            <Text style={styles.metaText}>{formatDate(item.scheduledAt)}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Clock size={14} color="#94A3B8" strokeWidth={2.5} />
                            <Text style={styles.metaText}>{formatTime(item.scheduledAt)}</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.addressBox}>
                            <MapPin size={12} color="#CBD5E1" strokeWidth={2.5} />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {item.address?.label?.toUpperCase() || 'DESTINATION'} · {item.address?.city?.toUpperCase() || 'LOCAL'}
                            </Text>
                        </View>
                        <Text style={styles.totalAmount}>₹{item.total.toFixed(0)}</Text>
                    </View>

                    {isActive && (
                        <View style={styles.liveTrackingPulse}>
                            <View style={styles.pulseContainer}>
                                <Navigation2 size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                                <Text style={styles.pulseText}>LIVE TRACKING</Text>
                            </View>
                        </View>
                    )}

                    {item.status === 'COMPLETED' && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.reorderBtn,
                                pressed && { backgroundColor: Colors.primary + '15' }
                            ]}
                            onPress={async (e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setReorderingId(item.id);
                                try {
                                    await bookingApi.reorderBooking(item);
                                    showSuccess('Re-initiation successful.');
                                    router.push('/(booking)/confirmation' as any);
                                } catch (err: any) {
                                    showError('Data transmission failed.');
                                } finally {
                                    setReorderingId(null);
                                }
                            }}
                        >
                            <RefreshCw size={14} color={Colors.primary} strokeWidth={3} />
                            <Text style={styles.reorderText}>REBOOK NOW</Text>
                        </Pressable>
                    )}
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Standardized Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 70, backgroundColor: '#FFF' }]}>
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.headerTitle}>MY BOOKINGS</Text>
                </View>
            </View>

            {/* Tab Bento Navigator */}
            <View style={[styles.tabContainer, { marginTop: insets.top + 75 }]}>
                <View style={styles.tabBento}>
                    {(['upcoming', 'past'] as TabKey[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <Pressable
                                key={tab}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => {
                                    setActiveTab(tab);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab === 'upcoming' ? 'UPCOMING' : 'PAST'}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <Animated.View entering={FadeInDown} style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                        <Calendar size={48} color="#CBD5E1" strokeWidth={1} />
                    </View>
                    <Text style={styles.emptyText}>{activeTab === 'upcoming' ? 'NO UPCOMING BOOKINGS' : 'NO PAST BOOKINGS'}</Text>
                    <Text style={styles.emptySubText}>
                        {activeTab === 'upcoming'
                            ? 'Book a new service from the explorer.'
                            : 'Historical data will be logged here.'}
                    </Text>
                </Animated.View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderBookingCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.5 },

    // Tabs
    tabContainer: { paddingHorizontal: 25, marginBottom: 15 },
    tabBento: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 5 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    tabText: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    tabTextActive: { color: '#111' },

    listContent: { paddingHorizontal: 25, gap: 15 },

    // Booking Cards
    bookingCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EEEEEE' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    bookingNumber: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    serviceTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.5, marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#AAA', fontWeight: '700' },
    metaDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#F0F0F0' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#FAFAFA' },
    addressBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    addressText: { fontSize: 11, color: '#AAA', fontWeight: '700', letterSpacing: 0.3 },
    totalAmount: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },

    liveTrackingPulse: { marginTop: 15, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.primary },
    pulseContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
    pulseText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

    reorderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 16, marginTop: 15 },
    reorderText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconBox: { width: 90, height: 90, borderRadius: 32, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 13, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    emptySubText: { fontSize: 12, color: '#CCC', fontWeight: '500', marginTop: 8, textAlign: 'center' },
});
