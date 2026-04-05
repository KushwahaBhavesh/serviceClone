import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle, Region, MapPressEvent, MarkerDragStartEndEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, {
    FadeInUp,
    FadeIn,
    FadeOut,
    FadeInRight,
    SlideInDown,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    interpolate,
    useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import {
    ChevronLeft,
    Navigation,
    CheckCircle2,
    Locate,
    ShieldCheck,
    ChevronRight,
    MapPin,
    Sparkles,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types/auth';

// ─── Constants ───
const GLASS_WHITE = 'rgba(0, 0, 0, 0.02)';
const GLASS_BORDER = 'rgba(0, 0, 0, 0.05)';

const INITIAL_REGION: Region = {
    latitude: 28.6273928,
    longitude: 77.3725807,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
};

export default function LocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const {
        role, email, name, businessName, skills,
        businessCategory, description,
    } = useLocalSearchParams<{
        role: UserRole;
        email: string;
        name?: string;
        businessName?: string;
        skills?: string;
        businessCategory?: string;
        description?: string;
    }>();

    const { completeOnboarding, isLoading, user } = useAuthStore();
    const { showInfo, showError, showSuccess } = useToast();

    const [locationName, setLocationName] = useState('');
    const [markerCoord, setMarkerCoord] = useState({
        latitude: INITIAL_REGION.latitude,
        longitude: INITIAL_REGION.longitude,
    });
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [isLocationSet, setIsLocationSet] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    // Animation values
    const markerScale = useSharedValue(1);
    const pulse = useSharedValue(0);

    // ─── Auto-detect on mount ───
    useEffect(() => {
        attemptAutoDetect();

        // Start pulse animation
        pulse.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1, // infinite
            false // no reverse
        );
    }, []);

    // Animate map camera to coordinates
    const animateToCoords = useCallback((coords: { latitude: number; longitude: number }, zoom = 0.008) => {
        mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: zoom, longitudeDelta: zoom },
            700,
        );
    }, []);

    // Reverse geocode coordinates → readable address
    const reverseGeocode = useCallback(async (coords: { latitude: number; longitude: number }): Promise<string | null> => {
        setIsReverseGeocoding(true);
        try {
            const results = await Location.reverseGeocodeAsync(coords);
            if (results?.length > 0) {
                const p = results[0];
                const parts = [p.name, p.street, p.district, p.city, p.region].filter(Boolean);
                // Deduplicate (e.g. name === street)
                const unique = [...new Set(parts)];
                const address = unique.slice(0, 4).join(', ');

                if (address) {
                    setLocationName(address);
                    setIsLocationSet(true);
                    return address;
                }
            }
            // Fallback: use raw coords
            const fallback = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
            setLocationName(fallback);
            setIsLocationSet(true);
            return fallback;
        } catch (error) {
            console.warn('Reverse geocode failed:', error);
            const fallback = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
            setLocationName(fallback);
            setIsLocationSet(true);
            return fallback;
        } finally {
            setIsReverseGeocoding(false);
        }
    }, []);

    // ─── Auto-detect GPS ───
    const attemptAutoDetect = useCallback(async () => {
        if (isFetchingLocation) return;
        setIsFetchingLocation(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasLocationPermission(status === 'granted');

            if (status !== 'granted') {
                setIsFetchingLocation(false);
                return; // Silent fail on mount; user can tap the FAB to retry
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setMarkerCoord(coords);
            animateToCoords(coords);
            await reverseGeocode(coords);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            // Silent fail on mount
        } finally {
            setIsFetchingLocation(false);
        }
    }, [isFetchingLocation, animateToCoords, reverseGeocode]);

    // ─── User taps FAB to auto-detect ───
    const handleAutoDetect = useCallback(async () => {
        if (isFetchingLocation) return;
        setIsFetchingLocation(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasLocationPermission(status === 'granted');

            if (status !== 'granted') {
                showInfo('Location access is needed to detect your area.');
                setIsFetchingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setMarkerCoord(coords);
            animateToCoords(coords, 0.005);
            await reverseGeocode(coords);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
            showError('Could not get your current location.');
        } finally {
            setIsFetchingLocation(false);
        }
    }, [isFetchingLocation, animateToCoords, reverseGeocode]);

    // ─── Map tap → move marker ───
    const handleMapPress = useCallback((e: MapPressEvent) => {
        const coords = e.nativeEvent.coordinate;
        setMarkerCoord(coords);
        setIsLocationSet(false);
        setLocationName('');
        reverseGeocode(coords);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [reverseGeocode]);

    // ─── Marker drag end → update location ───
    const handleMarkerDragEnd = useCallback((e: MarkerDragStartEndEvent) => {
        const coords = e.nativeEvent.coordinate;
        setMarkerCoord(coords);
        setIsLocationSet(false);
        setLocationName('');
        reverseGeocode(coords);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [reverseGeocode]);

    // ─── Finish onboarding ───
    const handleFinishOnboarding = useCallback(async () => {
        if (!locationName.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showInfo('Please select your location first.');
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Merchants go to pricing next. They do NOT complete onboarding here.
            if (role === 'MERCHANT') {
                router.push({
                    pathname: '/(onboarding)/pricing',
                    params: {
                        role,
                        email,
                        businessName,
                        businessCategory,
                        description,
                        locationName: locationName.trim(),
                        latitude: markerCoord.latitude,
                        longitude: markerCoord.longitude,
                        skills: typeof skills === 'string' ? skills : JSON.stringify(skills),
                    }
                });
                return;
            }

            // Customers and Agents finish onboarding here
            const cleanStr = (val: any) => {
                if (!val || val === 'null' || val === 'undefined') return undefined;
                return String(val);
            };

            await completeOnboarding({
                role: (cleanStr(role) as any) || 'CUSTOMER',
                email: cleanStr(email),
                businessName: cleanStr(businessName),
                businessCategory: cleanStr(businessCategory),
                description: cleanStr(description),
                name: cleanStr(name) || user?.name || undefined,
                locationName: locationName.trim(),
                latitude: markerCoord.latitude,
                longitude: markerCoord.longitude,
                skills: skills && skills !== 'undefined' ? JSON.parse(skills as string) : undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (role === 'AGENT') {
                router.replace('/(agent)/dashboard');
            } else {
                router.replace('/(tabs)/home');
            }
        } catch (err: any) {
            showError(err.message || 'Failed to complete onboarding.');
        }
    }, [
        locationName, markerCoord, role, email, businessName,
        businessCategory, description,
        skills, user, completeOnboarding, router,
    ]);

    // ─── Helper ───
    const getRoleLabel = () => {
        if (role === 'MERCHANT') return 'business';
        if (role === 'AGENT') return 'work';
        return 'home';
    };

    const isReady = isLocationSet && !!locationName.trim();

    // ─── RENDER ───
    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>SET LOCATION</Text>
                        <Text style={styles.headerSubtitle}>Pin your {getRoleLabel()} area</Text>
                    </View>
                </View>
            </View>

            {/* ═══ Map Viewport ═══ */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={INITIAL_REGION}
                    onPress={handleMapPress}
                    showsUserLocation={hasLocationPermission}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    userInterfaceStyle="light"
                    mapPadding={{ top: insets.top + 80, right: 0, bottom: 200, left: 0 }}
                >
                    <Marker
                        coordinate={markerCoord}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                        anchor={{ x: 1, y: 1 }}
                    >
                        <View style={styles.markerContainer}>
                            {/* Pulse Rings - Rooted at tip */}
                            <Animated.View style={[styles.pulseRing,
                            useAnimatedStyle(() => ({
                                transform: [{ scale: interpolate(pulse.value, [0, 1], [0.2, 2.0]) }],
                                opacity: interpolate(pulse.value, [0, 0.5, 1], [0, 0.5, 0]),
                            }))
                            ]} />

                            {/* Main Pin Marker */}
                            <Animated.View style={[styles.customMarker,
                            useAnimatedStyle(() => ({
                                transform: [{ scale: withSpring(isReverseGeocoding ? 1.15 : 1) }]
                            }))
                            ]}>
                                <View style={styles.pinWrapper}>
                                    <View style={styles.pinGlass}>
                                        <LinearGradient
                                            colors={[Colors.primary, '#FF7A00']}
                                            style={styles.pinInner}
                                        >
                                            <Navigation size={22} color="#FFF" />
                                        </LinearGradient>
                                    </View>
                                    <View style={styles.pinBeak} />
                                </View>
                            </Animated.View>
                        </View>
                    </Marker>

                    {(role === 'MERCHANT' || role === 'AGENT') && (
                        <Circle
                            center={markerCoord}
                            radius={800}
                            fillColor={Colors.primary + '15'}
                            strokeColor={Colors.primary + '40'}
                            strokeWidth={2}
                        />
                    )}
                </MapView>

                {/* Overlapping Address Bento Card */}
                <Animated.View
                    entering={FadeInUp.delay(300).springify()}
                    style={[styles.floatingBento, { top: insets.top + 80 }]}
                >
                    <BlurView intensity={100} tint="light" style={styles.bentoBlur}>
                        <View style={styles.bentoContent}>
                            <View style={[
                                styles.bentoIconBox,
                                isLocationSet && { backgroundColor: 'rgba(34, 197, 94, 0.15)' }
                            ]}>
                                {isReverseGeocoding ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : isLocationSet ? (
                                    <CheckCircle2 size={18} color="#22C55E" strokeWidth={3} />
                                ) : (
                                    <MapPin size={18} color={Colors.primary} strokeWidth={2.5} />
                                )}
                            </View>
                            <View style={styles.bentoTextCol}>
                                <Text style={styles.bentoLabel}>SELECTED ADDRESS</Text>
                                {isReverseGeocoding ? (
                                    <Text style={styles.bentoPlaceholder}>Verifying coordinates...</Text>
                                ) : (
                                    <Text style={styles.bentoAddress} numberOfLines={2}>
                                        {locationName || 'Tap the map to select your operative base'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* GPS Precision FAB */}
                <Animated.View entering={FadeIn.delay(500)} style={styles.gpsFabCol}>
                    <Pressable
                        onPress={handleAutoDetect}
                        disabled={isFetchingLocation}
                        style={({ pressed }) => [
                            styles.gpsFab,
                            pressed && { transform: [{ scale: 0.94 }] }
                        ]}
                    >
                        {isFetchingLocation ? (
                            <ActivityIndicator color={Colors.primary} size="small" />
                        ) : (
                            <Locate size={24} color={Colors.primary} strokeWidth={2.5} />
                        )}
                    </Pressable>
                </Animated.View>
            </View>

            {/* ═══ Immersive Footer ═══ */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.footerContent}>
                    <View style={styles.luxeInfoCard}>
                        <ShieldCheck size={20} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.luxeInfoText}>
                            Your base location determines your service marketplace visibility.
                        </Text>
                    </View>

                    <Animated.View entering={SlideInDown.delay(200)}>
                        <Pressable
                            onPress={handleFinishOnboarding}
                            disabled={!isReady || isLoading}
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                (!isReady || isLoading) && styles.primaryBtnDisabled,
                                pressed && isReady && { transform: [{ scale: 0.98 }] }
                            ]}
                        >
                            <LinearGradient
                                colors={!isReady || isLoading ? ['#E2E8F0', '#CBD5E1'] : [Colors.primary, '#FF7A00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.btnText}>
                                            {role === 'MERCHANT' ? 'SET BASE & PRICING' : 'COMPLETE REGISTER'}
                                        </Text>
                                        <ChevronRight size={22} color="#FFF" strokeWidth={2.5} />
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    // Map Section
    mapContainer: { flex: 1, backgroundColor: '#E2E8F0' },
    map: { flex: 1 },
    markerContainer: { width: 80, height: 100, justifyContent: 'flex-end', alignItems: 'center' },
    pulseRing: { position: 'absolute', bottom: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.primary },
    customMarker: { alignItems: 'center', marginBottom: 5 },
    pinWrapper: { alignItems: 'center' },
    pinGlass: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
    pinInner: { flex: 1, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
    pinBeak: { width: 16, height: 16, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], marginTop: -10, borderBottomRightRadius: 2, borderWidth: 1.5, borderRightColor: '#F1F5F9', borderBottomColor: '#F1F5F9', borderLeftColor: 'transparent', borderTopColor: 'transparent' },

    // Bento Floating Card
    floatingBento: { position: 'absolute', left: 20, right: 20, zIndex: 50 },
    bentoBlur: { borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FFF', shadowColor: '#000', },
    bentoContent: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
    bentoIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    bentoTextCol: { flex: 1 },
    bentoLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },
    bentoAddress: { fontSize: 14, fontWeight: '800', color: '#0F172A', lineHeight: 20 },
    bentoPlaceholder: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

    // GPS FAB
    gpsFabCol: { position: 'absolute', bottom: 30, right: 20 },
    gpsFab: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, borderWidth: 1.5, borderColor: '#F1F5F9' },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    footerContent: { paddingHorizontal: 25, paddingVertical: 20, gap: 15 },
    luxeInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#F1F5F9' },
    luxeInfoText: { flex: 1, fontSize: 12, color: '#64748B', fontWeight: '600', lineHeight: 18 },
    primaryBtn: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    primaryBtnDisabled: { opacity: 0.5 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    btnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
