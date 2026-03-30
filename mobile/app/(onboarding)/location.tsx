import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle, Region, MapPressEvent, MarkerDragStartEndEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    MapPin,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    LocateFixed,
    Shield,
    Crosshair,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types/auth';

// ─── Constants ───
const DARK_SLATE = '#0F172A';
const ELECTRIC_ORANGE = '#FF6B00';
const GLASS_WHITE = 'rgba(255, 255, 255, 0.08)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.12)';

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

    const [locationName, setLocationName] = useState('');
    const [markerCoord, setMarkerCoord] = useState({
        latitude: INITIAL_REGION.latitude,
        longitude: INITIAL_REGION.longitude,
    });
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [isLocationSet, setIsLocationSet] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    // ─── Auto-detect on mount ───
    useEffect(() => {
        attemptAutoDetect();
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
                Alert.alert(
                    'Permission Required',
                    'Location access is needed to detect your area. You can also tap the map to pick manually.',
                    [{ text: 'OK' }],
                );
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
            Alert.alert(
                'Detection Failed',
                'Could not get your current location. Try tapping the map instead.',
                [{ text: 'OK' }],
            );
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
            Alert.alert(
                'Location Required',
                'Please select your location by tapping the map or using auto-detect.',
                [{ text: 'OK' }],
            );
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
            Alert.alert('Error', err.message || 'Failed to complete onboarding. Please try again.');
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
            <StatusBar style="light" />

            {/* ═══ Header ═══ */}
            <LinearGradient
                colors={[DARK_SLATE, '#1E293B']}
                style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
            >
                <View style={styles.navbar}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            styles.navBtn,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <ChevronLeft size={24} color="#FFF" />
                    </Pressable>

                    <View style={styles.headerInfo}>
                        <Animated.Text entering={FadeInUp.delay(100)} style={styles.headerTitle}>Set Location</Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(200)} style={styles.headerSubtitle}>
                            Pin your {getRoleLabel()} area on the map
                        </Animated.Text>
                    </View>

                    <Animated.View entering={FadeInUp.delay(300)} style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>Final</Text>
                    </Animated.View>
                </View>
            </LinearGradient>

            {/* ═══ Map ═══ */}
            <View style={styles.mapWrapper}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={INITIAL_REGION}
                    onPress={handleMapPress}
                    showsUserLocation={hasLocationPermission}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    toolbarEnabled={false}
                    userInterfaceStyle="dark"
                    mapPadding={{ top: 80, right: 0, bottom: 30, left: 0 }}
                >
                    {/* Draggable Marker */}
                    <Marker
                        coordinate={markerCoord}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                        anchor={{ x: 0.5, y: 1 }}
                    >
                        <View style={styles.customMarker}>
                            <LinearGradient
                                colors={[ELECTRIC_ORANGE, '#E66100']}
                                style={styles.markerCircle}
                            >
                                <MapPin size={22} color="#FFF" fill="#FFF" />
                            </LinearGradient>
                            <View style={styles.markerPointer} />
                            <View style={styles.markerShadow} />
                        </View>
                    </Marker>

                    {/* Service radius overlay for merchant / agent */}
                    {(role === 'MERCHANT' || role === 'AGENT') && (
                        <Circle
                            center={markerCoord}
                            radius={500}
                            fillColor={ELECTRIC_ORANGE + '20'}
                            strokeColor={ELECTRIC_ORANGE + '80'}
                            strokeWidth={2}
                        />
                    )}
                </MapView>

                {/* ─── Address Card (top) ─── */}
                <Animated.View
                    entering={FadeInUp.delay(400).springify()}
                    style={styles.addressCard}
                >
                    <View style={styles.addressRow}>
                        <View style={[
                            styles.searchIconBox,
                            isLocationSet && { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
                        ]}>
                            {isReverseGeocoding ? (
                                <ActivityIndicator size="small" color={ELECTRIC_ORANGE} />
                            ) : isLocationSet ? (
                                <CheckCircle size={18} color="#22C55E" strokeWidth={2.5} />
                            ) : (
                                <Crosshair size={18} color={ELECTRIC_ORANGE} strokeWidth={2.5} />
                            )}
                        </View>
                        <View style={styles.addressTextBox}>
                            {isReverseGeocoding ? (
                                <Text style={styles.addressPlaceholderText}>Finding address…</Text>
                            ) : locationName ? (
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {locationName}
                                </Text>
                            ) : (
                                <Text style={styles.addressPlaceholderText}>
                                    Tap map or drag pin to select
                                </Text>
                            )}
                        </View>
                    </View>
                </Animated.View>

                {/* ─── Auto-Detect FAB ─── */}
                <Animated.View entering={FadeIn.delay(500)} style={styles.fabContainer}>
                    <Pressable
                        onPress={handleAutoDetect}
                        disabled={isFetchingLocation}
                        style={({ pressed }) => [
                            styles.fab,
                            pressed && { transform: [{ scale: 0.92 }] },
                            isFetchingLocation && styles.fabLoading,
                        ]}
                    >
                        {isFetchingLocation ? (
                            <ActivityIndicator color={ELECTRIC_ORANGE} size="small" />
                        ) : (
                            <LocateFixed size={22} color={ELECTRIC_ORANGE} strokeWidth={2.5} />
                        )}
                    </Pressable>
                    {!isLocationSet && !isFetchingLocation && (
                        <Animated.View entering={FadeIn.delay(600)} style={styles.fabLabel}>
                            <Text style={styles.fabLabelText}>Detect</Text>
                        </Animated.View>
                    )}
                </Animated.View>

                {/* ─── Tap hint (only when no location set) ─── */}
                {!isLocationSet && !isFetchingLocation && !isReverseGeocoding && (
                    <Animated.View
                        entering={FadeIn.delay(800)}
                        exiting={FadeOut.duration(300)}
                        style={styles.tapHint}
                    >
                        <Text style={styles.tapHintText}>Tap anywhere or drag the pin</Text>
                    </Animated.View>
                )}
            </View>

            {/* ═══ Footer ═══ */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0)', DARK_SLATE]}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                
                {/* Location info card */}
                <Animated.View entering={FadeInUp.delay(700)} style={[
                    styles.infoRow,
                    isReady && styles.infoRowSuccess,
                ]}>
                    <View style={[
                        styles.infoIconBox,
                        isReady && { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
                    ]}>
                        {isReady ? (
                            <CheckCircle size={18} color="#22C55E" strokeWidth={2.5} />
                        ) : (
                            <MapPin size={18} color={ELECTRIC_ORANGE} strokeWidth={2.5} />
                        )}
                    </View>
                    <View style={styles.infoTextBox}>
                        <Text style={styles.infoLabel}>
                            {isReady ? 'Location Confirmed' : 'Select Your Area'}
                        </Text>
                        <Text style={styles.infoValue} numberOfLines={2}>
                            {locationName || 'Tap the map or use auto-detect to set your location'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Privacy note */}
                <Animated.View entering={FadeInUp.delay(800)} style={styles.privacyNote}>
                    <Shield size={12} color="#94A3B8" strokeWidth={2.5} />
                    <Text style={styles.privacyText}>
                        Your location is private and only used to match nearby services
                    </Text>
                </Animated.View>

                {/* CTA */}
                <Animated.View entering={FadeInUp.delay(900)}>
                    <Pressable
                        onPress={handleFinishOnboarding}
                        disabled={!isReady || isLoading}
                        style={({ pressed }) => [
                            styles.ctaBtn,
                            (!isReady || isLoading) && styles.ctaBtnDisabled,
                            pressed && isReady && !isLoading && styles.ctaBtnPressed,
                        ]}
                    >
                        <LinearGradient
                            colors={
                                !isReady || isLoading
                                    ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                                    : [ELECTRIC_ORANGE, '#E66100']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={!isReady ? "#94A3B8" : "#FFF"} />
                            ) : (
                                <>
                                    <Text style={[styles.ctaText, !isReady && { color: '#94A3B8' }]}>Finish Registration</Text>
                                    <ChevronRight size={20} color={!isReady ? "#94A3B8" : "#FFF"} strokeWidth={3} />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_SLATE,
    },

    // ─── Header ───
    header: {
        zIndex: 10,
        paddingBottom: 14,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        gap: 14,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: GLASS_WHITE,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    stepBadge: {
        backgroundColor: 'rgba(255, 107, 0, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.3)',
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: ELECTRIC_ORANGE,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ─── Map ───
    mapWrapper: {
        flex: 1,
        backgroundColor: '#1E293B',
        overflow: 'hidden',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    customMarker: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3.5,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 12,
    },
    markerPointer: {
        width: 12,
        height: 12,
        backgroundColor: ELECTRIC_ORANGE,
        transform: [{ rotate: '45deg' }],
        marginTop: -7,
        borderBottomRightRadius: 2,
    },
    markerShadow: {
        width: 20,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginTop: 2,
    },

    // ─── Address Card ───
    addressCard: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)',
    },
    addressTextBox: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 36,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 20,
    },
    addressPlaceholderText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94A3B8',
        lineHeight: 20,
    },

    // ─── FAB ───
    fabContainer: {
        position: 'absolute',
        bottom: 28,
        right: 16,
        alignItems: 'center',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
    },
    fabLoading: {
        opacity: 0.7,
    },
    fabLabel: {
        marginTop: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
    },
    fabLabelText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },

    // ─── Tap Hint ───
    tapHint: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
    },
    tapHintText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // ─── Footer ───
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 24,
        backgroundColor: DARK_SLATE,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 16,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: GLASS_BORDER,
    },
    footerGradient: {
        position: 'absolute',
        top: -80,
        left: 0,
        right: 0,
        height: 80,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
    },
    infoRowSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    infoIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)',
    },
    infoTextBox: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        lineHeight: 20,
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    privacyText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },

    // ─── CTA ───
    ctaBtn: {
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: ELECTRIC_ORANGE,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    ctaBtnDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    ctaBtnPressed: {
        transform: [{ scale: 0.98 }],
    },
    ctaGradient: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 0.2,
    },
});
