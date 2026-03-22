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
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi, bookingApi, customerApi, type Category, type Service, type Booking, type NearbyMerchant, type Promotion, type Address } from '../../lib/marketplace';

const { width } = Dimensions.get('window');




const CATEGORY_COLORS = ['#E3F2FD', '#FFF3E0', '#F3E5F5', '#E8F5E9', '#FCE4EC', '#FFFDE7', '#E0F2F1', '#F5F5F5'];

export default function HomeScreen() {
    const router = useRouter();
    const { user, updateLocation } = useAuthStore();
    const [search, setSearch] = useState('');
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

            // Fetch Nearby Merchants — use profile location, fallback to device GPS
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
                    
                    // Transform promotions into banner format
                    if (promoRes.data.promotions.length > 0) {
                        const dynamicBanners = promoRes.data.promotions.map((p: Promotion) => ({
                            id: p.id,
                            title: p.merchant.businessName,
                            discount: p.type === 'PERCENTAGE' ? `${p.value}% OFF` : `₹${p.value} OFF`,
                            subtitle: p.code,
                            color: Colors.primary, // Could be dynamic if we add a 'color' field to Promotion
                            merchantId: p.merchantId
                        }));
                        setBanners(dynamicBanners);
                    }
                }
            } catch (e) {
                console.log('Error fetching nearby merchants/promos', e);
            }

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
            fetchData(); // Refresh metrics for new location
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

    const renderBanners = () => {
        if (banners.length === 0 && !isLoading) return null;
        
        return (
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - Spacing.lg * 2 + Spacing.md}
                decelerationRate="fast"
                contentContainerStyle={styles.bannerContainer}
            >
                {banners.map((banner) => (
                    <Pressable
                        key={banner.id}
                        style={[styles.banner, { backgroundColor: banner.color }]}
                        onPress={() => banner.merchantId ? router.push({ pathname: '/(tabs)/explore', params: { merchantId: banner.merchantId } }) : null}
                    >
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{banner.title}</Text>
                            <Text style={styles.bannerDiscount}>{banner.discount}</Text>
                            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                            <View style={styles.bannerBtn}>
                                <Text style={styles.bannerBtnText}>Claim Offer</Text>
                            </View>
                        </View>
                        <Ionicons name="gift-outline" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                        <View style={styles.bannerCircle} />
                    </Pressable>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Header: Location & Notifications */}
                <View style={styles.header}>
                    <Pressable style={styles.locationContainer} onPress={handleLocationPress} disabled={isUpdatingLocation}>
                        {isUpdatingLocation ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Ionicons name="location" size={20} color={Colors.primary} />
                        )}
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationLabel}>{isUpdatingLocation ? 'Updating...' : 'Location'}</Text>
                            <Text style={styles.locationValue} numberOfLines={1}>
                                {user?.locationName || 'Tap to set your location'}
                            </Text>
                        </View>
                        <Ionicons name={isUpdatingLocation ? 'sync' : 'chevron-down'} size={16} color={Colors.textMuted} />
                    </Pressable>
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
                {renderBanners()}

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

                {/* Nearby Providers */}
                {nearbyMerchants.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Nearby Providers</Text>
                            <Pressable onPress={() => router.push('/(tabs)/explore')}>
                                <Text style={styles.seeAll}>Map View</Text>
                            </Pressable>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.nearbyContainer}
                        >
                            {nearbyMerchants.map((merchant) => (
                                <Pressable
                                    key={merchant.id}
                                    style={styles.nearbyCard}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/(booking)/merchant-profile',
                                            params: { id: merchant.id },
                                        });
                                    }}
                                >
                                    <View style={styles.nearbyImagePlaceholder}>
                                        {merchant.logoUrl ? (
                                            <Image source={{ uri: merchant.logoUrl }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <Ionicons name="briefcase" size={32} color={Colors.primary} />
                                        )}
                                    </View>
                                    <View style={styles.nearbyContent}>
                                        <Text style={styles.nearbyTitle} numberOfLines={1}>{merchant.businessName}</Text>
                                        <View style={styles.ratingRow}>
                                            <Ionicons name="star" size={12} color="#FFB000" />
                                            <Text style={styles.nearbyRating}>{merchant.rating.toFixed(1)}</Text>
                                            <Text style={styles.nearbyDistance}> · {merchant.distance.toFixed(1)} km</Text>
                                        </View>
                                        {merchant.merchantServices[0] && (
                                            <Text style={styles.nearbyService} numberOfLines={1}>
                                                {merchant.merchantServices[0].service.name}
                                            </Text>
                                        )}
                                    </View>
                                    {merchant.isVerified && (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* Featured Services */}
                {featuredServices.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recommended for You</Text>
                            <Pressable onPress={() => router.push('/(tabs)/explore')}>
                                <Text style={styles.seeAll}>See All</Text>
                            </Pressable>
                        </View>

                        <View style={styles.featuredContainer}>
                            {featuredServices.map((service) => {
                                const providerCount = service._count?.merchantServices || service.merchantServices?.length || 0;
                                return (
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
                                                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                                                <Text style={styles.ratingText}>{service.duration} min</Text>
                                                {providerCount > 0 && (
                                                    <Text style={styles.ratingText}> · {providerCount} provider{providerCount > 1 ? 's' : ''}</Text>
                                                )}
                                            </View>
                                            <Text style={styles.priceText}>₹{service.basePrice}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Location Selection Modal */}
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

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Current Location Option */}
                            <Pressable 
                                style={styles.locationOption} 
                                onPress={handleUpdateToCurrentLocation}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: Colors.primary + '15' }]}>
                                    <Ionicons name="location" size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionTitle}>Use Current Location</Text>
                                    <Text style={styles.optionSub}>Using GPS</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                            </Pressable>

                            <View style={styles.divider} />

                            <Text style={styles.modalSectionTitle}>Saved Addresses</Text>

                            {isAddressLoading ? (
                                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
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
                                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                    </Pressable>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No saved addresses found</Text>
                                    <Pressable 
                                        style={styles.addBtn}
                                        onPress={() => {
                                            setShowLocationModal(false);
                                            router.push('/(customer)/address/new' as any);
                                        }}
                                    >
                                        <Text style={styles.addBtnText}>+ Add New Address</Text>
                                    </Pressable>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    nearbyContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl },
    nearbyCard: {
        width: 160,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        paddingBottom: Spacing.sm,
    },
    nearbyImagePlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nearbyContent: { padding: Spacing.sm },
    nearbyTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
    nearbyRating: { fontSize: 12, color: Colors.textSecondary, marginLeft: 2 },
    nearbyDistance: { fontSize: 11, color: Colors.textMuted },
    nearbyService: { fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '600' },
    verifiedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 12 },
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
    scrollContent: { paddingBottom: 160 },
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
    bannerContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
    banner: {
        width: width - Spacing.lg * 2,
        height: 160,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: Spacing.md,
    },
    bannerIcon: {
        position: 'absolute',
        right: 10,
        top: 40,
        transform: [{ rotate: '-15deg' }],
    },
    bannerContent: { flex: 1, zIndex: 1, justifyContent: 'center' },
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
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xxl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    optionSub: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginBottom: Spacing.md,
    },
    addBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primary + '10',
        borderRadius: BorderRadius.md,
    },
    addBtnText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: FontSize.sm,
    },
});
