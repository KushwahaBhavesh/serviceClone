import { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    withSpring
} from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi, bookingApi, customerApi, type Category, type Service, type Booking, type NearbyMerchant, type Promotion, type Address } from '../../lib/marketplace';
import { HomeHeader } from '../../components/navigation/HomeHeader';
import { PromotionBanner } from '../../components/ui/PromotionBanner';
import { ModernCategoryGrid } from '../../components/ui/ModernCategoryGrid';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateLocation } = useAuthStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
    const [nearbyMerchants, setNearbyMerchants] = useState<NearbyMerchant[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    // Animation state
    const scrollY = useSharedValue(0);

    const onScroll = (event: any) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 50], [0, 1], Extrapolate.CLAMP);
        return { opacity };
    });

    const fetchAddresses = useCallback(async () => {
        try {
            setIsAddressLoading(true);
            const res = await customerApi.listAddresses();
            setSavedAddresses(res.data.addresses);
        } catch (err) {
            console.error('Failed to fetch addresses:', err);
        } finally {
            setIsAddressLoading(false);
        }
    }, []);

    const handleLocationPress = () => {
        setShowLocationModal(true);
        fetchAddresses();
    };

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

            // Fetch Nearby Merchants
            try {
                let lat = user?.latitude;
                let lng = user?.longitude;

                if (!lat || !lng) {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        lat = loc.coords.latitude;
                        lng = loc.coords.longitude;
                    }
                }

                if (lat && lng) {
                    const [nearbyRes, promoRes] = await Promise.all([
                        catalogApi.listNearbyMerchants({
                            latitude: lat,
                            longitude: lng,
                            limit: 5,
                        }),
                        catalogApi.listNearbyPromotions({
                            latitude: lat,
                            longitude: lng,
                            limit: 5,
                        })
                    ]);

                    setNearbyMerchants(nearbyRes.data.merchants);

                    if (promoRes.data.promotions.length > 0) {
                        const dynamicBanners = promoRes.data.promotions.map((p: Promotion) => ({
                            id: p.id,
                            title: p.merchant.businessName,
                            discount: p.type === 'PERCENTAGE' ? `${p.value}% OFF` : `₹${p.value} OFF`,
                            subtitle: p.code,
                            color: Colors.primary,
                            merchantId: p.merchantId
                        }));
                        setBanners(dynamicBanners);
                    }
                }
            } catch (e) {
                console.log('Error fetching nearby merchants/promos', e);
            }

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
    }, [user?.latitude, user?.longitude, updateLocation]);

    const handleUpdateToCurrentLocation = useCallback(async () => {
        try {
            setShowLocationModal(false);
            setIsUpdatingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setIsUpdatingLocation(false);
                return;
            }
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = position.coords;

            const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
            let locationName = 'Current Location';
            if (geo) {
                const parts = [geo.name, geo.district || geo.subregion, geo.city].filter(Boolean);
                locationName = parts.join(', ') || geo.region || 'Current Location';
            }

            await updateLocation(latitude, longitude, locationName);
            fetchData();
        } catch (err) {
            console.error('Location update failed:', err);
        } finally {
            setIsUpdatingLocation(false);
        }
    }, [updateLocation, fetchData]);

    const handleAddressSelect = async (address: Address) => {
        try {
            setShowLocationModal(false);
            if (address.latitude && address.longitude) {
                await updateLocation(address.latitude, address.longitude, address.label || address.line1);
                fetchData();
            }
        } catch (err) {
            console.error('Failed to select address:', err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handlePromotionPress = (merchantId?: string) => {
        if (merchantId) {
            router.push({ pathname: '/(tabs)/explore', params: { merchantId } });
        }
    };

    const handleCategoryPress = (cat: Category) => {
        router.push({ pathname: '/(tabs)/explore', params: { categoryId: cat.id } });
    };

    return (
        <View style={styles.container}>
            {/* Animated Sticky Header */}
            <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }, headerAnimatedStyle]}>
                <HomeHeader
                    user={user}
                    unreadCount={unreadCount}
                    isUpdatingLocation={isUpdatingLocation}
                    onLocationPress={handleLocationPress}
                    onNotificationsPress={() => router.push('/(customer)/notifications' as any)}
                    onProfilePress={() => router.push('/(tabs)/profile' as any)}
                />
            </Animated.View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressViewOffset={insets.top + 20} />
                }
            >
                {/* Hero Greeting Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.greetingTitle}>Find your</Text>
                            <Text style={styles.greetingTitleBold}>Next Service</Text>
                        </View>
                        <Pressable style={styles.heroAvatar} onPress={() => router.push('/(tabs)/profile' as any)}>
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                            ) : (
                                <Ionicons name="person" size={24} color={Colors.primary} />
                            )}
                        </Pressable>
                    </View>

                    {/* Search Bar - Integrated into Hero */}
                    <View style={styles.searchContainer}>
                        <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/explore')}>
                            <Ionicons name="search" size={20} color={Colors.textMuted} />
                            <Text style={styles.searchPlaceholder}>Try "AC Repair" or "Plumber"</Text>
                            <View style={styles.filterBtn}>
                                <Ionicons name="options-outline" size={20} color={Colors.textOnPrimary} />
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Active Booking Pulse Widget */}
                {activeBooking && (
                    <Pressable
                        style={styles.pulseWidget}
                        onPress={() => router.push(`/(booking)/tracking/${activeBooking.id}` as any)}
                    >
                        <View style={styles.pulseHeader}>
                            <View style={styles.pulseIndicator}>
                                <View style={styles.pulseDot} />
                                <View style={styles.pulseRing} />
                            </View>
                            <Text style={styles.pulseBadgeText}>LIVE TRACKING</Text>
                        </View>
                        <View style={styles.pulseBody}>
                            <View style={styles.pulseContent}>
                                <Text style={styles.pulseTitle}>{activeBooking.items[0]?.service?.name || 'Ongoing Service'}</Text>
                                <Text style={styles.pulseStatus}>{activeBooking.status.replace('_', ' ')}</Text>
                            </View>
                            <Ionicons name="chevron-forward-circle" size={32} color={Colors.primary} />
                        </View>
                    </Pressable>
                )}

                {/* Banners - Horizontal Scroll */}
                {banners.length > 0 && (
                    <Animated.ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={width - Spacing.lg * 2 + Spacing.md}
                        decelerationRate="fast"
                        contentContainerStyle={styles.bannerList}
                    >
                        {banners.map((banner) => (
                            <PromotionBanner key={banner.id} banner={banner} onPress={handlePromotionPress} />
                        ))}
                    </Animated.ScrollView>
                )}

                {/* Categories Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Explore Categories</Text>
                    <Pressable style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </Pressable>
                </View>

                <ModernCategoryGrid
                    categories={categories}
                    onCategoryPress={handleCategoryPress}
                    isLoading={isLoading}
                />

                {/* Nearby Providers Section */}
                {nearbyMerchants.length > 0 && (
                    <View style={styles.nearbySection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Nearby Experts</Text>
                            <Pressable style={styles.mapBtn} onPress={() => router.push('/(tabs)/explore')}>
                                <Ionicons name="map-outline" size={16} color={Colors.primary} />
                                <Text style={styles.mapBtnText}>Map View</Text>
                            </Pressable>
                        </View>

                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.nearbyList}
                        >
                            {nearbyMerchants.map((merchant) => (
                                <Pressable
                                    key={merchant.id}
                                    style={styles.merchantCard}
                                    onPress={() => router.push({ pathname: '/(booking)/merchant-profile', params: { id: merchant.id } })}
                                >
                                    <View style={styles.merchantImageContainer}>
                                        {merchant.logoUrl ? (
                                            <Image source={{ uri: merchant.logoUrl }} style={styles.merchantLogo} />
                                        ) : (
                                            <Ionicons name="business" size={32} color={Colors.primary} />
                                        )}
                                        <View style={styles.distanceBadge}>
                                            <Text style={styles.distanceText}>{merchant.distance.toFixed(1)} km</Text>
                                        </View>
                                    </View>
                                    <View style={styles.merchantInfo}>
                                        <Text style={styles.merchantName} numberOfLines={1}>{merchant.businessName}</Text>
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={12} color="#FFB000" />
                                            <Text style={styles.ratingValue}>{merchant.rating.toFixed(1)}</Text>
                                        </View>
                                        {merchant.isVerified && (
                                            <View style={styles.verifRow}>
                                                <Ionicons name="checkmark-circle" size={14} color={Colors.info} />
                                                <Text style={styles.verifText}>Verified</Text>
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                            ))}
                        </Animated.ScrollView>
                    </View>
                )}

                {/* Recommended Section */}
                {featuredServices.length > 0 && (
                    <View style={styles.recommendedSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recommended Services</Text>
                        </View>
                        <View style={styles.recommendedList}>
                            {featuredServices.map((service) => (
                                <Pressable
                                    key={service.id}
                                    style={styles.serviceCard}
                                    onPress={() => router.push(`/(booking)/${service.slug}` as any)}
                                >
                                    <View style={styles.serviceIconWrap}>
                                        <Ionicons name="sparkles" size={24} color={Colors.primary} />
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{service.name}</Text>
                                        <Text style={styles.serviceMeta}>{service.duration} mins • Starting at ₹{service.basePrice}</Text>
                                    </View>
                                    <View style={styles.bookBtn}>
                                        <Text style={styles.bookBtnText}>Book</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </Animated.ScrollView>

            {/* Location Selection Modal (Unchanged functionality, improved UI) */}
            <Modal
                visible={showLocationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Location</Text>
                            <Pressable onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </Pressable>
                        </View>

                        <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <Pressable style={styles.locationOption} onPress={handleUpdateToCurrentLocation}>
                                <View style={[styles.optionIcon, { backgroundColor: Colors.primary + '15' }]}>
                                    <Ionicons name="locate" size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionTitle}>Use Current Location</Text>
                                    <Text style={styles.optionSub}>Based on your GPS</Text>
                                </View>
                            </Pressable>

                            <View style={styles.modalDivider} />
                            <Text style={styles.modalSubheading}>Saved Addresses</Text>

                            {isAddressLoading ? (
                                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
                            ) : savedAddresses.length > 0 ? (
                                savedAddresses.map((addr) => (
                                    <Pressable
                                        key={addr.id}
                                        style={styles.locationOption}
                                        onPress={() => handleAddressSelect(addr)}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: Colors.backgroundAlt }]}>
                                            <Ionicons
                                                name={addr.label?.toLowerCase() === 'home' ? 'home' : addr.label?.toLowerCase() === 'work' ? 'briefcase' : 'location'}
                                                size={20}
                                                color={Colors.text}
                                            />
                                        </View>
                                        <View style={styles.optionTextContainer}>
                                            <Text style={styles.optionTitle}>{addr.label || 'Address'}</Text>
                                            <Text style={styles.optionSub} numberOfLines={1}>
                                                {[addr.line1, addr.city].filter(Boolean).join(', ')}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No saved addresses found</Text>
                                    <Pressable style={styles.addBtn} onPress={() => { setShowLocationModal(false); router.push('/(customer)/address/new' as any); }}>
                                        <Text style={styles.addBtnText}>+ Add New Address</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Animated.ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    scrollContent: { paddingBottom: 120 },
    heroSection: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
        backgroundColor: Colors.background,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    greetingTitle: {
        fontSize: 24,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    greetingTitleBold: {
        fontSize: 32,
        color: Colors.text,
        fontWeight: '900',
        lineHeight: 36,
    },
    heroAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.backgroundAlt,
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 28 },
    searchContainer: { marginTop: Spacing.md },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        height: 60,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: FontSize.md,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    filterBtn: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    pulseWidget: {
        backgroundColor: '#000', // Premium black widget
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    pulseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    pulseIndicator: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
    pulseRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, opacity: 0.5 },
    pulseBadgeText: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    pulseBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pulseContent: { flex: 1 },
    pulseTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    pulseStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    bannerList: { paddingLeft: Spacing.lg, paddingRight: Spacing.md, marginBottom: Spacing.xl },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    seeAllText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
    nearbySection: { marginBottom: Spacing.xl },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    mapBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
    nearbyList: { paddingLeft: Spacing.lg, paddingRight: Spacing.md, gap: Spacing.md },
    merchantCard: {
        width: 180,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xl,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    merchantImageContainer: {
        width: '100%',
        height: 110,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 10,
    },
    merchantLogo: { width: '100%', height: '100%' },
    distanceBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    distanceText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    merchantInfo: { gap: 2 },
    merchantName: { fontSize: 15, fontWeight: '800', color: Colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingValue: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
    verifRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    verifText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
    recommendedSection: { paddingHorizontal: Spacing.lg },
    recommendedList: { gap: Spacing.md },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    serviceIconWrap: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceInfo: { flex: 1, marginLeft: Spacing.md },
    serviceName: { fontSize: 16, fontWeight: '800', color: Colors.text },
    serviceMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    bookBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
    },
    bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center' },
    modalScroll: { paddingHorizontal: 24 },
    locationOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderRadius: 16 },
    optionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionTextContainer: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    optionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
    modalSubheading: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { color: Colors.textMuted, marginBottom: 16 },
    addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    addBtnText: { color: '#fff', fontWeight: '800' },
});
