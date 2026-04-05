import { useState, useCallback, useRef, useEffect } from 'react';
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
    ScrollView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    FadeInDown,
} from 'react-native-reanimated';
import {
    Search,
    MapPin,
    Bell,
    User,
    Sparkles,
    ChevronRight,
    Map,
    ShieldCheck,
    Star,
    ArrowRight,
    Zap,
    X,
    LocateFixed,
    Home,
    Briefcase,
    Navigation2
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { catalogApi, bookingApi, customerApi, type Category, type Service, type Booking, type NearbyMerchant, type Promotion, type Address } from '../../lib/marketplace';
import { PromotionBanner } from '../../components/ui/PromotionBanner';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateLocation } = useAuthStore();
    const { showInfo, showSuccess } = useToast();

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

    const scrollY = useSharedValue(0);

    const onScroll = (event: any) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [20, 80], [0, 1], Extrapolate.CLAMP);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

            if (catRes.status === 'fulfilled') setCategories(catRes.value.data.categories.slice(0, 8));
            if (serRes.status === 'fulfilled') setFeaturedServices(serRes.value.data.services);
            if (bookRes.status === 'fulfilled') {
                const active = bookRes.value.data.bookings.find((b: Booking) =>
                    ['ACCEPTED', 'IN_PROGRESS', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(b.status)
                );
                setActiveBooking(active || null);
            }
            if (notifRes.status === 'fulfilled') setUnreadCount(notifRes.value.data.unreadCount || 0);

            // Nearby Logic
            let lat = user?.latitude;
            let lng = user?.longitude;

            if (lat && lng) {
                const [nearbyRes, promoRes] = await Promise.allSettled([
                    catalogApi.listNearbyMerchants({ latitude: lat, longitude: lng, limit: 5 }),
                    catalogApi.listNearbyPromotions({ latitude: lat, longitude: lng, limit: 5 })
                ]);
                if (nearbyRes.status === 'fulfilled') setNearbyMerchants(nearbyRes.value.data.merchants);
                if (promoRes.status === 'fulfilled' && promoRes.value.data.promotions.length > 0) {
                    setBanners(promoRes.value.data.promotions.slice(0, 6).map((p: Promotion) => ({
                        id: p.id,
                        title: p.merchant.businessName,
                        discount: p.type === 'PERCENTAGE' ? `${p.value}% OFF` : `₹${p.value} OFF`,
                        subtitle: p.code,
                        color: Colors.primary,
                        merchantId: p.merchantId
                    })));
                } else {
                    setBanners([]); // Clear if none
                }
            }
        } catch (err) {
            console.error('Home fetchData failed:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.latitude, user?.longitude]);

    const getCategoryIcon = (slug: string) => {
        const iconSize = 22;
        const iconColor = Colors.primary;
        switch (slug) {
            case 'cleaning': return <Sparkles size={iconSize} color={iconColor} />;
            case 'plumbing': return <Zap size={iconSize} color={iconColor} />;
            case 'electrician': return <Zap size={iconSize} color={iconColor} />;
            case 'salon': return <Sparkles size={iconSize} color={iconColor} />;
            case 'ac-repair': return <Zap size={iconSize} color={iconColor} />;
            case 'painting': return <Sparkles size={iconSize} color={iconColor} />;
            default: return <Sparkles size={iconSize} color={iconColor} />;
        }
    };

    const handleUpdateToCurrentLocation = useCallback(async () => {
        try {
            setShowLocationModal(false);
            setIsUpdatingLocation(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showInfo('Location permission required.');
                setIsUpdatingLocation(false);
                return;
            }
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = position.coords;
            const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
            let locationName = geo ? [geo.district, geo.city].filter(Boolean).join(', ') : 'Current Location';
            await updateLocation(latitude, longitude, locationName);
            showSuccess(`Location set to ${locationName}`);
            fetchData();
        } catch (err) {
            console.error('Location update failed:', err);
        } finally {
            setIsUpdatingLocation(false);
        }
    }, [updateLocation, fetchData]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Opaque Sticky Header - Only show on scroll */}
            <Animated.View style={[styles.stickyHeader, { height: insets.top + 85, backgroundColor: '#FFF' }, headerStyle]}>
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <View style={styles.headerWelcomeBox}>
                        <Text style={styles.headerHiText}>HI, {user?.name?.split(' ')[0] || 'GUEST'}</Text>
                        <Pressable onPress={handleLocationPress} style={styles.headerLocationBox}>
                            <MapPin size={14} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.headerLocationText} numberOfLines={1}>{user?.locationName || 'Set Location'}</Text>
                        </Pressable>
                    </View>
                    <View style={styles.flex} />
                    <View style={styles.headerActions}>
                        <Pressable onPress={() => router.push('/(customer)/notifications' as any)} style={styles.actionBtnHeader}>
                            <Bell size={20} color="#0F172A" strokeWidth={2} />
                            {unreadCount > 0 && <View style={styles.notifIndicator} />}
                        </Pressable>
                    </View>
                </View>
                <View style={styles.headerBorder} />
            </Animated.View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />
                }
            >
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={['#F8FAFC', '#FFF']}
                        style={[styles.heroBg, { paddingTop: insets.top + 30 }]}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.greetingBox}>
                                <Text style={styles.greetingTitle}>WELCOME BACK</Text>
                                <View style={styles.greetingRow}>
                                    <View>
                                        <Text style={styles.userNameText}>{user?.name?.split(' ')[0] || 'GUEST'}</Text>
                                        <Text style={styles.welcomeText}>Find the best services near you</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.searchCardWrap}>
                                <Pressable style={styles.searchCard} onPress={() => router.push('/(tabs)/explore')}>
                                    <Search size={22} color="#94A3B8" strokeWidth={2.5} />
                                    <Text style={styles.searchCardPlaceholder}>Search for services...</Text>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* High Impact Promotional Section - Only show if active */}
                {banners.length > 0 && (
                    <View style={styles.featuredPromoSection}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.promoList}
                            snapToInterval={width - 50}
                            decelerationRate="fast"
                        >
                            {banners.map((banner) => (
                                <View key={banner.id} style={styles.promoWrap}>
                                    <PromotionBanner banner={banner} onPress={(mid) => router.push({ pathname: '/(tabs)/explore', params: { merchantId: mid } })} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Tracking Pulse */}
                {activeBooking && (
                    <View style={styles.trackingPulseContainer}>
                        <Pressable
                            style={styles.trackingCard}
                            onPress={() => router.push(`/(booking)/tracking/${activeBooking.id}` as any)}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF7A00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.trackingGradient}
                            >
                                <View style={styles.trackingInfo}>
                                    <View style={styles.liveTag}>
                                        <View style={styles.liveCircle} />
                                        <Text style={styles.liveTagText}>LIVE TRACKING</Text>
                                    </View>
                                    <Text style={styles.trackingService}>{activeBooking.items[0]?.service?.name.toUpperCase()}</Text>
                                    <Text style={styles.trackingStatusText}>{activeBooking.status.replace('_', ' ')}</Text>
                                </View>
                                <View style={styles.trackingIconBox}>
                                    <Navigation2 size={24} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                                </View>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}


                {/* Categories Matrix */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeading}>
                        <View style={styles.sectionTitleBlock}>
                            <View style={styles.sectionTitleDot} />
                            <Text style={styles.sectionTitleText}>ALL CATEGORIES</Text>
                        </View>
                        <Pressable onPress={() => router.push('/(tabs)/explore')} style={styles.viewMoreBtn}>
                            <Text style={styles.viewMoreText}>SEE ALL</Text>
                            <ChevronRight size={12} color={Colors.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.bentoContainer}>
                        <View style={styles.bentoRow}>
                            {categories.slice(0, 2).map((cat, idx) => (
                                <View key={cat.id} style={styles.bentoItemHalf}>
                                    <Pressable style={styles.bentoCard} onPress={() => router.push(`/(customer)/category/${cat.id}` as any)}>
                                        <LinearGradient colors={['#F8FAFC', '#FFF']} style={styles.bentoGradient}>
                                            <View style={styles.bentoIconBox}>
                                                {getCategoryIcon(cat.slug)}
                                            </View>
                                            <Text style={styles.bentoName}>{cat.name.toUpperCase()}</Text>
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                        <View style={styles.bentoRow}>
                            {categories.slice(2, 4).map((cat, idx) => (
                                <View key={cat.id} style={styles.bentoItemHalf}>
                                    <Pressable style={styles.bentoCard} onPress={() => router.push(`/(customer)/category/${cat.id}` as any)}>
                                        <LinearGradient colors={['#F8FAFC', '#FFF']} style={styles.bentoGradient}>
                                            <View style={styles.bentoIconBox}>
                                                {getCategoryIcon(cat.slug)}
                                            </View>
                                            <Text style={styles.bentoName}>{cat.name.toUpperCase()}</Text>
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Service Providers Nearby */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeading}>
                        <View style={styles.sectionTitleBlock}>
                            <View style={styles.sectionTitleDot} />
                            <Text style={styles.sectionTitleText}>PROVIDERS NEAR YOU</Text>
                        </View>
                        <Pressable style={styles.viewMoreBtn}>
                            <Text style={styles.viewMoreText}>VIEW ON MAP</Text>
                            <Navigation2 size={12} color={Colors.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.expertCollection}>
                        {nearbyMerchants.map((merchant, index) => (
                            <View key={merchant.id}>
                                <Pressable
                                    style={styles.proExpertCard}
                                    onPress={() => router.push(`/(customer)/merchant/${merchant.id}` as any)}
                                >
                                    <View style={styles.expertImageBox}>
                                        {merchant.logoUrl ? (
                                            <Image source={{ uri: merchant.logoUrl }} style={styles.expertImg} />
                                        ) : (
                                            <View style={styles.expertImgPlaceholder}>
                                                <User size={40} color={Colors.primary + '30'} />
                                            </View>
                                        )}
                                        <View style={styles.distanceChip}>
                                            <Text style={styles.distanceChipText}>{merchant.distance?.toFixed(1) || '0.0'} km</Text>
                                        </View>
                                    </View>

                                    <View style={styles.expertDetails}>
                                        <View style={styles.expertMetaRow}>
                                            <Text style={styles.expertBusinessName} numberOfLines={1}>
                                                {merchant.businessName}
                                            </Text>
                                            <View style={styles.expertRatingBox}>
                                                <Star size={12} color={Colors.primary} fill={Colors.primary} />
                                                <Text style={styles.expertRatingText}>{merchant.rating?.toFixed(1) || '5.0'}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.expertFooterRow}>
                                            <View style={styles.verifiedTag}>
                                                <ShieldCheck size={12} color="#10B981" />
                                                <Text style={styles.verifiedTagText}>VERIFIED</Text>
                                            </View>
                                            <View style={styles.viewIdentityBtn}>
                                                <Text style={styles.viewIdentityText}>VIEW PROFILE</Text>
                                                <ChevronRight size={14} color={Colors.primary} />
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.ScrollView>

            {/* AI Assistant FAB */}
            <Animated.View 
                entering={FadeInDown.delay(1000).springify()}
                style={[styles.aiFabContainer, { bottom: insets.bottom + 90 }]}
            >
                <Pressable 
                    style={styles.aiFab} 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/(customer)/ai-assistant' as any);
                    }}
                >
                    <LinearGradient
                        colors={[Colors.primary, '#FF7A00']}
                        style={styles.aiFabGradient}
                    >
                        <Sparkles size={24} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </Animated.View>

            {/* Premium Location Selector Modal */}
            <Modal
                visible={showLocationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.premiumModal}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeaderBox}>
                            <View>
                                <Text style={styles.modalTitleText}>SELECT ADDRESS</Text>
                                <Text style={styles.modalSubtitleText}>Where do you need the service?</Text>
                            </View>
                            <Pressable onPress={() => setShowLocationModal(false)} style={styles.closeBtnModal}>
                                <X size={20} color="#64748B" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                            <Pressable style={styles.premiumOption} onPress={handleUpdateToCurrentLocation}>
                                <LinearGradient colors={[Colors.primary + '20', 'transparent']} style={styles.optionCircle}>
                                    <LocateFixed size={22} color={Colors.primary} strokeWidth={2.5} />
                                </LinearGradient>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionMainText}>USE CURRENT LOCATION</Text>
                                    <Text style={styles.optionSubText}>Locate me using GPS</Text>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </Pressable>

                            <View style={styles.modalSectionGap} />
                            <Text style={styles.modalLabelText}>SAVED ADDRESSES</Text>

                            {isAddressLoading ? (
                                <ActivityIndicator color={Colors.primary} style={{ margin: 40 }} />
                            ) : savedAddresses.length > 0 ? (
                                savedAddresses.map((addr) => (
                                    <Pressable key={addr.id} style={styles.premiumOption} onPress={() => { updateLocation(addr.latitude!, addr.longitude!, addr.label!); setShowLocationModal(false); fetchData(); }}>
                                        <View style={styles.optionCircle}>
                                            {addr.label?.toLowerCase() === 'home' ? <Home size={22} color="#64748B" /> : addr.label?.toLowerCase() === 'work' ? <Briefcase size={22} color="#64748B" /> : <MapPin size={22} color="#64748B" />}
                                        </View>
                                        <View style={styles.optionTextContainer}>
                                            <Text style={styles.optionMainText}>{addr.label?.toUpperCase()}</Text>
                                            <Text style={styles.optionSubText} numberOfLines={1}>{addr.line1}</Text>
                                        </View>
                                        <ChevronRight size={18} color="#CBD5E1" />
                                    </Pressable>
                                ))
                            ) : (
                                <View style={styles.emptyStore}>
                                    <Text style={styles.emptyStoreText}>No saved addresses found</Text>
                                    <Pressable style={styles.addRegistryBtn} onPress={() => { setShowLocationModal(false); router.push('/(customer)/profile/addresses'); }}>
                                        <Text style={styles.addRegistryText}>ADD NEW ADDRESS</Text>
                                    </Pressable>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    flex: { flex: 1 },

    // Pro Max Sticky Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    headerWelcomeBox: { justifyContent: 'center' },
    headerHiText: { fontSize: 18, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    headerLocationBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    headerLocationText: { fontSize: 13, fontWeight: '700', color: '#64748B', maxWidth: 180 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionBtnHeader: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    notifIndicator: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#FFF' },
    headerBorder: { height: 1, backgroundColor: '#F1F5F9' },

    // Immersive Hero Pro Max
    heroContainer: { backgroundColor: '#FFF', overflow: 'hidden' },
    heroBg: { paddingHorizontal: 25 },
    heroContent: { paddingBottom: 20 },
    greetingBox: { marginBottom: 30 },
    greetingTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 2.5 },
    greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    userNameText: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1.2 },
    welcomeText: { fontSize: 14, fontWeight: '700', color: '#64748B', marginTop: 2 },
    profileBox: { width: 62, height: 62, padding: 3, borderRadius: 24, backgroundColor: '#F1F5F9' },
    profileGradient: { flex: 1, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },

    locationSelectorLarge: { marginBottom: 25 },
    locationBoxLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 18, borderRadius: 28, borderWidth: 1.5, borderColor: '#F1F5F9' },
    iconCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
    locationInfo: { flex: 1, marginLeft: 16 },
    locationLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    locationAddress: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 3 },

    searchCardWrap: { marginBottom: 20 },
    searchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', height: 72, borderRadius: 28, paddingHorizontal: 22, gap: 16 },
    searchCardPlaceholder: { flex: 1, fontSize: 16, fontWeight: '600', color: '#94A3B8' },

    // Tracking Pulse
    trackingPulseContainer: { paddingHorizontal: 25, marginBottom: 35 },
    trackingCard: { borderRadius: 36, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    trackingGradient: { flexDirection: 'row', alignItems: 'center', padding: 28 },
    trackingInfo: { flex: 1 },
    liveTag: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    liveCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
    liveTagText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    trackingService: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    trackingStatusText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: 4 },
    trackingIconBox: { width: 56, height: 56, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

    // Promo Section
    featuredPromoSection: { marginTop: -10, marginBottom: 35 },
    promoList: { paddingLeft: 25, paddingRight: 10 },
    promoWrap: { width: width - 50, marginRight: 15 },
    promoWrapStatic: { paddingHorizontal: 25 },
    staticPromoCard: { height: 160, borderRadius: 36, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
    staticPromoGradient: { flex: 1, padding: 28 },
    staticPromoContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    staticPromoText: { flex: 1 },
    staticPromoHeader: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
    staticPromoTitle: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: -1, marginVertical: 2 },
    staticPromoSub: { fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 12 },
    staticPromoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    staticPromoBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    staticPromoIconBox: { position: 'absolute', right: -10, top: -10 },

    // Sections Framework
    sectionContainer: { marginBottom: 45 },
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, marginBottom: 20 },
    sectionTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sectionTitleDot: { width: 4, height: 16, borderRadius: 2, backgroundColor: Colors.primary },
    sectionTitleText: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 1.5 },
    viewMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '10', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    viewMoreText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },

    // Bento Matrix
    bentoContainer: { paddingHorizontal: 25, gap: 12 },
    bentoRow: { flexDirection: 'row', gap: 12 },
    bentoItemHalf: { flex: 1 },
    bentoCard: { height: 120, borderRadius: 32, overflow: 'hidden', borderWidth: 1.5, borderColor: '#F1F5F9' },
    bentoGradient: { flex: 1, padding: 22, justifyContent: 'space-between' },
    bentoIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10 },
    bentoName: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: 0.3 },

    // Pro Experts
    expertCollection: { paddingHorizontal: 25, gap: 18 },
    proExpertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 36, borderWidth: 1.5, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
    expertImageBox: { width: 110, height: 110, borderRadius: 26, backgroundColor: '#F8FAFC', overflow: 'hidden' },
    expertImg: { width: '100%', height: '100%' },
    expertImgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary + '05' },
    distanceChip: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(15,23,42,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    distanceChipText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
    expertDetails: { flex: 1, marginLeft: 20 },
    expertMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    expertBusinessName: { fontSize: 16, fontWeight: '900', color: '#0F172A', flex: 1, letterSpacing: -0.3 },
    expertRatingBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    expertRatingText: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
    expertFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B98115', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    verifiedTagText: { fontSize: 10, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
    viewIdentityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewIdentityText: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 0.3 },

    // Premium Modal
    modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
    premiumModal: { backgroundColor: '#FFF', borderTopLeftRadius: 48, borderTopRightRadius: 48, paddingBottom: 50, paddingHorizontal: 30, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.1, shadowRadius: 40 },
    modalDragHandle: { width: 44, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 18, marginBottom: 12 },
    modalHeaderBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 25 },
    modalTitleText: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    modalSubtitleText: { fontSize: 13, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginTop: 2 },
    closeBtnModal: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    modalList: { paddingBottom: 30 },
    premiumOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 22, borderBottomWidth: 1.5, borderBottomColor: '#F8FAFC' },
    optionCircle: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    optionTextContainer: { flex: 1, marginLeft: 20 },
    optionMainText: { fontSize: 15, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    optionSubText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
    modalSectionGap: { height: 2, backgroundColor: '#F8FAFC', marginVertical: 25 },
    modalLabelText: { fontSize: 11, fontWeight: '900', color: '#CBD5E1', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
    emptyStore: { alignItems: 'center', paddingVertical: 40 },
    emptyStoreText: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginBottom: 20 },
    addRegistryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 15, borderRadius: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15 },
    addRegistryText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    // AI FAB
    aiFabContainer: { position: 'absolute', right: 25, zIndex: 100 },
    aiFab: { width: 64, height: 64, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    aiFabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
