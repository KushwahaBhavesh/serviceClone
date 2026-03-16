import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi, bookingApi, customerApi, type Category, type Service, type Booking } from '../../lib/marketplace';

const { width } = Dimensions.get('window');

const BANNERS = [
    { id: '1', title: 'Limited Time Offer', discount: '50% OFF', subtitle: 'On Home Cleaning', color: Colors.primary },
    { id: '2', title: 'Premium Services', discount: 'BEST VALUE', subtitle: 'At Your Doorstep', color: Colors.secondary },
];

const CATEGORY_COLORS = ['#E3F2FD', '#FFF3E0', '#F3E5F5', '#E8F5E9', '#FCE4EC', '#FFFDE7', '#E0F2F1', '#F5F5F5'];

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
    const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [catRes, serRes, bookRes, notifRes] = await Promise.all([
                catalogApi.listCategories(),
                catalogApi.listServices({ limit: 5 }),
                bookingApi.listBookings({ status: 'ACCEPTED,IN_PROGRESS' }),
                customerApi.listNotifications(),
            ]);

            setCategories(catRes.data.categories.slice(0, 8));
            setFeaturedServices(serRes.data.services);

            // Find the most urgent active booking
            const active = bookRes.data.bookings.find((b: Booking) =>
                ['ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(b.status)
            );
            setActiveBooking(active || null);
            setUnreadCount(notifRes.data.unreadCount || 0);
        } catch (err) {
            console.error('Home fetchData failed:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header: Location & Notifications */}
            <View style={styles.header}>
                <View style={styles.locationContainer}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>Location</Text>
                        <Text style={styles.locationValue} numberOfLines={1}>
                            {user?.locationName || 'Select your location'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </View>
                <Pressable
                    style={styles.notificationBtn}
                    onPress={() => router.push('/(customer)/notifications' as any)}
                >
                    <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}! 👋</Text>
                    <Text style={styles.subtitle}>Which service do you need today?</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/explore')}>
                        <Ionicons name="search" size={20} color={Colors.textMuted} />
                        <Text style={styles.searchPlaceholder}>Search for services...</Text>
                        <View style={styles.filterBtn}>
                            <Ionicons name="options-outline" size={20} color={Colors.textOnPrimary} />
                        </View>
                    </Pressable>
                </View>

                {/* Active Booking Pulse Widget */}
                {activeBooking && (
                    <Pressable
                        style={styles.pulseWidget}
                        onPress={() => router.push(`/(booking)/tracking/${activeBooking.id}` as any)}
                    >
                        <View style={styles.pulseContainer}>
                            <View style={styles.pulseDot} />
                            <View style={styles.pulseRing} />
                        </View>
                        <View style={styles.pulseContent}>
                            <Text style={styles.pulseTitle}>Active Service: {activeBooking.status.replace('_', ' ')}</Text>
                            <Text style={styles.pulseSub}>
                                {activeBooking.items[0]?.service?.name || 'In Progress'} · Track Now
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                    </Pressable>
                )}

                {/* Banners */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={width - Spacing.lg * 2 + Spacing.md}
                    decelerationRate="fast"
                    contentContainerStyle={styles.bannerContainer}
                >
                    {BANNERS.map((banner) => (
                        <View key={banner.id} style={[styles.banner, { backgroundColor: banner.color }]}>
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerTitle}>{banner.title}</Text>
                                <Text style={styles.bannerDiscount}>{banner.discount}</Text>
                                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                <Pressable style={styles.bannerBtn}>
                                    <Text style={styles.bannerBtnText}>Book Now</Text>
                                </Pressable>
                            </View>
                            <View style={styles.bannerCircle} />
                        </View>
                    ))}
                </ScrollView>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <Pressable onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </Pressable>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <View style={styles.categoryGrid}>
                        {categories.map((cat, index) => (
                            <Pressable
                                key={cat.id}
                                style={styles.categoryCard}
                                onPress={() => router.push({ pathname: '/(tabs)/explore', params: { categoryId: cat.id } })}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]}>
                                    <Ionicons name="sparkles" size={24} color={Colors.text} />
                                </View>
                                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Featured Services */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                    <Pressable onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </Pressable>
                </View>

                <View style={styles.featuredContainer}>
                    {featuredServices.map((service) => (
                        <Pressable
                            key={service.id}
                            style={styles.featuredCard}
                            onPress={() => router.push(`/(booking)/${service.slug}` as any)}
                        >
                            <View style={styles.featuredImagePlaceholder}>
                                <Ionicons name="construct" size={40} color={Colors.primary} />
                            </View>
                            <View style={styles.featuredContent}>
                                <Text style={styles.featuredTitle}>{service.name}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#FFB000" />
                                    <Text style={styles.ratingText}>4.8 · {service.duration} min</Text>
                                </View>
                                <Text style={styles.priceText}>₹{service.basePrice}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        justifyContent: 'space-between',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundAlt,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        flex: 1,
        marginRight: Spacing.md,
    },
    locationTextContainer: { marginLeft: Spacing.xs, flex: 1 },
    locationLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', fontWeight: 'bold' },
    locationValue: { fontSize: 13, color: Colors.text, fontWeight: '700' },
    notificationBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.md,
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.background,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 3,
    },
    badgeText: { fontSize: 9, fontWeight: '800' as const, color: '#fff' },
    scrollContent: { paddingBottom: Spacing.xxl },
    greetingSection: { paddingHorizontal: Spacing.lg, marginVertical: Spacing.md },
    greeting: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
    searchSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 56,
    },
    searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
    searchPlaceholder: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSize.md, color: Colors.textMuted },
    filterBtn: {
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
        gap: Spacing.md,
    },
    pulseContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        zIndex: 2,
    },
    pulseRing: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors.primary,
        opacity: 0.3,
    },
    pulseContent: { flex: 1 },
    pulseTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
    pulseSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    bannerContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl },
    banner: {
        width: width - Spacing.lg * 2,
        height: 160,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        padding: Spacing.xl,
    },
    bannerContent: { flex: 1, justifyContent: 'center' },
    bannerTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
    bannerDiscount: { color: '#FFF', fontSize: 32, fontWeight: '900', marginVertical: 4 },
    bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
    bannerBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: Spacing.md,
    },
    bannerBtnText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
    bannerCircle: {
        position: 'absolute',
        right: -50,
        bottom: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    seeAll: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.lg,
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    categoryCard: { width: (width - Spacing.lg * 2 - Spacing.md * 3) / 4, alignItems: 'center', marginBottom: Spacing.md },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    categoryName: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center' },
    featuredContainer: { paddingHorizontal: Spacing.lg },
    featuredCard: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        padding: Spacing.sm,
        alignItems: 'center',
    },
    featuredImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredContent: { marginLeft: Spacing.md, flex: 1 },
    featuredTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
    priceText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary, marginTop: Spacing.xs },
});
