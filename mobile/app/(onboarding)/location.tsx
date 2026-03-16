import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MapPin, Navigation, ChevronLeft, Search, CheckCircle } from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

const INITIAL_REGION = {
    latitude: 28.6273928,
    longitude: 77.3725807,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export default function LocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { role, email, businessName, skills, businessCategory, description, panNumber, gstNumber } = useLocalSearchParams<{
        role: UserRole;
        email: string;
        businessName?: string;
        skills?: string;
        businessCategory?: string;
        description?: string;
        panNumber?: string;
        gstNumber?: string;
    }>();
    
    const { completeOnboarding, isLoading, user } = useAuthStore();

    const [locationName, setLocationName] = useState('');
    const [region, setRegion] = useState(INITIAL_REGION);
    const [markerCoord, setMarkerCoord] = useState({
        latitude: INITIAL_REGION.latitude,
        longitude: INITIAL_REGION.longitude,
    });
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

    // Fetch address from coordinates
    const reverseGeocode = async (coords: { latitude: number, longitude: number }) => {
        try {
            const result = await Location.reverseGeocodeAsync(coords);
            if (result && result.length > 0) {
                const item = result[0];
                const address = [item.name, item.street, item.city, item.region]
                    .filter(Boolean)
                    .join(', ');
                setLocationName(address);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    };

    const handleAutoDetect = async () => {
        setIsFetchingLocation(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== 'granted') {
                Alert.alert('Permission denied', 'We need location access to find your business area.');
                setIsFetchingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            setRegion(newRegion);
            setMarkerCoord({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            
            await reverseGeocode(location.coords);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('Error', 'Could not detect location. Please try manually.');
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const handleMapPress = (e: any) => {
        const coords = e.nativeEvent.coordinate;
        setMarkerCoord(coords);
        reverseGeocode(coords);
    };

    const handleFinishOnboarding = async () => {
        if (!locationName.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Location Required', 'Please set your service location on the map.');
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await completeOnboarding({
                role: role || 'CUSTOMER',
                email,
                businessName: businessName || undefined,
                businessCategory: businessCategory || undefined,
                description: description || undefined,
                panNumber: panNumber ? panNumber.trim() : undefined,
                gstNumber: gstNumber ? gstNumber.trim() : undefined,
                skills: skills ? skills.split(',') : undefined,
                name: user?.name,
                locationName: locationName.trim(),
                latitude: markerCoord.latitude,
                longitude: markerCoord.longitude,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            if (role === 'MERCHANT') {
                router.replace('/(merchant)/dashboard');
            } else if (role === 'AGENT') {
                router.replace('/(agent)/dashboard');
            } else {
                router.replace('/(tabs)/home');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to complete onboarding');
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar style="dark" />
                
                {/* Minimal Header */}
                <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                    <View style={styles.navbar}>
                        <Pressable onPress={() => router.back()} style={styles.minimalBackBtn}>
                            <ChevronLeft size={24} color="#0F172A" />
                        </Pressable>
                        <View style={styles.headerInfo}>
                            <Text style={styles.minimalTitle}>Service Area</Text>
                            <Text style={styles.minimalSubtitle}>Where will you operate?</Text>
                        </View>
                    </View>
                </View>

                {/* Map Section */}
                <View style={styles.mapWrapper}>
                    <MapView
                        style={styles.map}
                        region={region}
                        onRegionChangeComplete={setRegion}
                        onPress={handleMapPress}
                        showsUserLocation={permissionStatus === 'granted'}
                    >
                        <Marker coordinate={markerCoord}>
                            <View style={styles.customMarker}>
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.markerCircle}
                                >
                                    <MapPin size={24} color="#FFF" fill="#FFF" />
                                </LinearGradient>
                                <View style={styles.markerPointer} />
                            </View>
                        </Marker>
                        
                        {(role === 'MERCHANT' || role === 'AGENT') && (
                            <Circle
                                center={markerCoord}
                                radius={500}
                                fillColor={Colors.primary + '10'}
                                strokeColor={Colors.primary + '20'}
                                strokeWidth={2}
                            />
                        )}
                    </MapView>

                    {/* Minimal Silk Address Box */}
                    <Animated.View 
                        entering={FadeInUp.delay(300)} 
                        style={[styles.addressCard, { top: 20 }]}
                    >
                        <View style={styles.addressRow}>
                            <View style={styles.searchIconBox}>
                                <Search size={18} color={Colors.primary} />
                            </View>
                            <Input
                                value={locationName}
                                onChangeText={setLocationName}
                                placeholder="Detecting your location..."
                                containerStyle={styles.minimalInputContainer}
                            />
                        </View>
                    </Animated.View>

                    {/* Minimal FAB */}
                    <Pressable
                        onPress={handleAutoDetect}
                        style={({ pressed }) => [
                            styles.fab,
                            pressed && { transform: [{ scale: 0.95 }] }
                        ]}
                    >
                        {isFetchingLocation ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <Navigation size={22} color={Colors.primary} strokeWidth={2.5} />
                        )}
                    </Pressable>
                </View>

                {/* Silk Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                    <View style={styles.infoRow}>
                        <CheckCircle size={18} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.infoText}>
                            Address: {locationName ? locationName : "Drag map to select"}
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleFinishOnboarding}
                        disabled={!locationName.trim() || isLoading}
                        style={({ pressed }) => [
                            styles.silkBtn,
                            (!locationName.trim() || isLoading) && styles.silkBtnDisabled,
                            pressed && !isLoading && styles.silkBtnPressed
                        ]}
                    >
                        <LinearGradient
                            colors={!locationName.trim() || isLoading ? ['#CBD5E1', '#94A3B8'] : [Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.silkBtnGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.silkBtnText}>Finish Registration</Text>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        backgroundColor: '#FAFAFA',
        paddingBottom: 16,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        gap: 16,
    },
    minimalBackBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerInfo: {
        flex: 1,
    },
    minimalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    minimalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    mapWrapper: {
        flex: 1,
        backgroundColor: '#E2E8F0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    customMarker: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    markerPointer: {
        width: 12,
        height: 12,
        backgroundColor: Colors.primary,
        transform: [{ rotate: '45deg' }],
        marginTop: -6,
        borderBottomRightRadius: 2,
    },
    addressCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 15,
    },
    addressRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    minimalInputContainer: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        lineHeight: 18,
    },
    silkBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
    },
    silkBtnDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    silkBtnPressed: {
        transform: [{ scale: 0.98 }],
    },
    silkBtnGradient: {
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    silkBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
    },
});
