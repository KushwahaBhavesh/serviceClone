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
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
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
            <StatusBar style="dark" />
            
            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            {/* ═══ Header ═══ */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.navbar}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            styles.navBtn,
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
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
            </View>

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
                                colors={[Colors.primary, Colors.primaryLight]}
                                style={styles.markerCircle}
                            >
                                <Ionicons name="location" size={24} color="#FFF" />
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
                            fillColor={Colors.primary + '20'}
                            strokeColor={Colors.primary + '80'}
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
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : isLocationSet ? (
                                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                            ) : (
                                <Ionicons name="scan-outline" size={18} color={Colors.primary} />
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
                            <ActivityIndicator color={Colors.primary} size="small" />
                        ) : (
                            <Ionicons name="locate" size={24} color={Colors.primary} />
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
                    colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
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
                            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                        ) : (
                            <Ionicons name="location" size={18} color={Colors.primary} />
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
                    <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
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
                                    : [Colors.primary, Colors.primaryLight]
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
                                    <Ionicons name="chevron-forward" size={20} color={!isReady ? "#94A3B8" : "#FFF"} />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    decoration: {
        position: 'absolute',
        borderRadius: 100,
    },
    decor1: {
        width: 250,
        height: 250,
        backgroundColor: Colors.primary + '08',
        top: -80,
        right: -80,
    },
    decor2: {
        width: 150,
        height: 150,
        backgroundColor: Colors.secondary + '08',
        bottom: '10%',
        left: -50,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 20,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.textDark,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    stepBadge: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mapWrapper: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    customMarker: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    markerPointer: {
        width: 14,
        height: 14,
        backgroundColor: Colors.primary,
        transform: [{ rotate: '45deg' }],
        marginTop: -8,
        borderBottomRightRadius: 2,
    },
    markerShadow: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginTop: 4,
    },
    addressCard: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
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
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    addressTextBox: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 36,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textDark,
        lineHeight: 20,
    },
    addressPlaceholderText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        lineHeight: 20,
    },
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
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    fabLoading: {
        opacity: 0.7,
    },
    fabLabel: {
        marginTop: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fabLabelText: {
        color: Colors.textDark,
        fontSize: 11,
        fontWeight: '800',
    },
    tapHint: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    tapHintText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 24,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 16,
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
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    infoRowSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderColor: 'rgba(34, 197, 94, 0.1)',
    },
    infoIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    infoTextBox: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.textDark,
        fontWeight: '600',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20,
    },
    privacyText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    ctaBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        height: 64,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    ctaBtnDisabled: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    ctaBtnPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    ctaGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
