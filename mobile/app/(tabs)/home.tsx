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
import { ImmersiveHero } from '../../components/ui/ImmersiveHero';
import { BentoCategoryGrid } from '../../components/ui/BentoCategoryGrid';
import { LinearGradient } from 'expo-linear-gradient';

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
        // Only show the minimalist sticky header after scrolling past the main hero content
        const opacity = interpolate(scrollY.value, [100, 200], [0, 1], Extrapolate.CLAMP);
        const translateY = interpolate(scrollY.value, [100, 200], [-20, 0], Extrapolate.CLAMP);
        return {
            opacity,
            transform: [{ translateY }]
        };
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
            const [catRes, serRes, bookRes, notifRes] = await Promise.allSettled([
                catalogApi.listCategories(),
                catalogApi.listServices({ limit: 5 }),
                bookingApi.listBookings({ status: 'ACCEPTED,IN_PROGRESS' }),
                customerApi.listNotifications(),
            ]);

            if (catRes.status === 'fulfilled') {
                setCategories(catRes.value.data.categories.slice(0, 8));
            } else {
                console.warn('Failed to load categories:', catRes.reason?.message);
            }

            if (serRes.status === 'fulfilled') {
                setFeaturedServices(serRes.value.data.services);
            } else {
                console.warn('Failed to load services:', serRes.reason?.message);
            }

            if (bookRes.status === 'fulfilled') {
                const active = bookRes.value.data.bookings.find((b: Booking) =>
                    ['ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(b.status)
                );
                setActiveBooking(active || null);
            } else {
                console.warn('Failed to load bookings:', bookRes.reason?.message);
            }

            if (notifRes.status === 'fulfilled') {
                setUnreadCount(notifRes.value.data.unreadCount || 0);
            } else {
                console.warn('Failed to load notifications:', notifRes.reason?.message);
            }

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
                    const [nearbyRes, promoRes] = await Promise.allSettled([
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

                    if (nearbyRes.status === 'fulfilled') {
                        setNearbyMerchants(nearbyRes.value.data.merchants);
                    }

                    if (promoRes.status === 'fulfilled' && promoRes.value.data.promotions.length > 0) {
                        const dynamicBanners = promoRes.value.data.promotions.map((p: Promotion) => ({
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
            {/* Animated Sticky Header - Minimalist version when scrolled */}
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
                contentContainerStyle={[styles.scrollContent]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressViewOffset={insets.top + 20} />
                }
            >
                {/* Premium Hero Section */}
                <ImmersiveHero
                    user={user}
                    onProfilePress={() => router.push('/(tabs)/profile' as any)}
                    onSearchPress={() => router.push('/(tabs)/explore')}
                />

                <View style={{ height: 40 }} /> {/* Spacer for floating search bar */}

                {/* Active Booking Pulse Widget */}
                {activeBooking && (
                    <Pressable
                        style={styles.pulseWidget}
                        onPress={() => router.push(`/(booking)/tracking/${activeBooking.id}` as any)}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.pulseGradient}
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
                        </LinearGradient>
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

                <BentoCategoryGrid
                    categories={categories}
                    onCategoryPress={handleCategoryPress}
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

                        <View style={styles.nearbyList}>
                            {nearbyMerchants.slice(0, 3).map((merchant) => (
                                <Pressable
                                    key={merchant.id}
                                    style={styles.merchantCard}
                                    onPress={() => router.push({ pathname: '/(booking)/merchant-profile', params: { id: merchant.id } })}
                                >
                                    <View style={styles.merchantImageContainer}>
                                        {merchant.logoUrl ? (
                                            <Image source={{ uri: merchant.logoUrl }} style={styles.merchantLogo} />
                                        ) : (
                                            <View style={styles.logoPlaceholder}>
                                                <Ionicons name="business" size={32} color={Colors.primary} />
                                            </View>
                                        )}
                                        <View style={styles.distanceBadge}>
                                            <Ionicons name="navigate" size={12} color="#fff" />
                                            <Text style={styles.distanceText}>{merchant.distance.toFixed(1)} km</Text>
                                        </View>
                                    </View>
                                    <View style={styles.merchantInfo}>
                                        <View style={styles.merchantMainInfo}>
                                            <Text style={styles.merchantName} numberOfLines={1}>{merchant.businessName}</Text>
                                            <View style={styles.ratingRow}>
                                                <Ionicons name="star" size={14} color="#FFB000" />
                                                <Text style={styles.ratingValue}>{merchant.rating.toFixed(1)}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.merchantFooter}>
                                            {merchant.isVerified && (
                                                <View style={styles.verifRow}>
                                                    <Ionicons name="checkmark-circle" size={14} color={Colors.info} />
                                                    <Text style={styles.verifText}>Verified Professional</Text>
                                                </View>
                                            )}
                                            <View style={styles.viewProfileBtn}>
                                                <Text style={styles.viewProfileText}>View Profile</Text>
                                                <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
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
    pulseWidget: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    pulseGradient: {
        padding: Spacing.lg,
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
    sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    seeAllText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
    nearbySection: { marginBottom: Spacing.xl },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '12',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    mapBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: -0.2 },
    nearbyList: { 
        paddingHorizontal: Spacing.lg, 
        gap: Spacing.lg,
    },
    merchantCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 18,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    merchantImageContainer: {
        width: '100%',
        height: 160,
        borderRadius: 20,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.01)',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary + '05',
    },
    merchantLogo: { width: '100%', height: '100%' },
    distanceBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,107,0,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    distanceText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    merchantInfo: { gap: 8 },
    merchantMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    merchantName: { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingValue: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
    merchantFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    verifRow: { 
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.info + '10', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8,
    },
    verifText: { fontSize: 11, fontWeight: '800', color: Colors.info, transform: [{ translateY: -0.5 }] },
    viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewProfileText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
    recommendedSection: { paddingHorizontal: Spacing.lg },
    recommendedList: { gap: Spacing.md },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 2,
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
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    bookBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 25,
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
