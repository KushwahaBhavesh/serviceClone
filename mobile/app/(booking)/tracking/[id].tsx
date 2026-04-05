import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Pressable,
    ScrollView,
    Image,
    Platform,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { 
    ArrowLeft, 
    Phone, 
    Navigation2, 
    MapPin, 
    ShieldCheck, 
    Clock, 
    CheckCircle2, 
    User, 
    Bike, 
    Home, 
    Sparkles, 
    MoreHorizontal,
    MessageSquare,
    Zap
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { bookingApi, type Booking } from '../../../lib/marketplace';
import { useSocket } from '../../../hooks/useSocket';
import { getImageUrl } from '../../../lib/api';

const { width, height } = Dimensions.get('window');

const STATUS_STEPS = [
    { key: 'ACCEPTED', label: 'CONFIRMED', icon: CheckCircle2 },
    { key: 'AGENT_ASSIGNED', label: 'EXPERT ALLOTTED', icon: User },
    { key: 'EN_ROUTE', label: 'EN ROUTE', icon: Bike },
    { key: 'ARRIVED', label: 'ARRIVED', icon: MapPin },
    { key: 'IN_PROGRESS', label: 'IN PROGRESS', icon: Sparkles },
    { key: 'COMPLETED', label: 'REVOLVED', icon: ShieldCheck },
];

export default function TrackingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);
    const { joinBooking, leaveBooking, onBookingUpdate, onAgentLocation } = useSocket();

    const pulseValue = useSharedValue(1);

    useEffect(() => {
        pulseValue.value = withRepeat(withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    }, []);

    const fetchBookingDetails = useCallback(async () => {
        try {
            const { data } = await bookingApi.getBooking(id);
            setBooking(data.booking);
            const agent = (data.booking as any).agent;
            if (agent?.lastLocationLat && agent?.lastLocationLng) {
                setAgentLocation({ latitude: agent.lastLocationLat, longitude: agent.lastLocationLng });
            }
        } catch { /* silent */ }
        finally { setIsLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchBookingDetails();
        if (id) joinBooking(id as string);
        return () => { if (id) leaveBooking(id as string); };
    }, [fetchBookingDetails, id]);

    useEffect(() => {
        const cleanupStatus = onBookingUpdate((data) => {
            if (data.bookingId === id) setBooking(prev => prev ? { ...prev, status: data.status as any } : prev);
        });
        const cleanupLocation = onAgentLocation((data) => {
            setAgentLocation({ latitude: data.latitude, longitude: data.longitude });
        });
        return () => { cleanupStatus(); cleanupLocation(); };
    }, [id]);

    useEffect(() => {
        if (mapRef.current && agentLocation && booking?.address?.latitude && booking?.address?.longitude) {
            mapRef.current.fitToCoordinates([
                agentLocation,
                { latitude: booking.address.latitude, longitude: booking.address.longitude }
            ], { edgePadding: { top: 120, right: 60, bottom: 400, left: 60 }, animated: true });
        }
    }, [agentLocation, booking]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: 1.2 - pulseValue.value,
    }));

    if (isLoading && !booking) {
        return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (!booking) {
        return <View style={styles.center}><Text style={styles.errorText}>SESSION RESET REQUIRED</Text></View>;
    }

    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === booking.status);
    const agent = (booking as any).agent;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Glassmorphic Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.headerContent}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={20} color="#0F172A" strokeWidth={3} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>MISSION TRACKING</Text>
                        <Text style={styles.headerSub}>LOG #{booking.bookingNumber}</Text>
                    </View>
                    <View style={styles.oracleBadge}><Sparkles size={12} color={Colors.primary} /></View>
                </View>
            </View>

            {/* Immersive Map */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: booking.address?.latitude || 28.6273,
                    longitude: booking.address?.longitude || 77.3725,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={mapStyle}
            >
                {booking.address?.latitude && (
                    <Marker coordinate={{ latitude: booking.address.latitude, longitude: booking.address.longitude }}>
                        <View style={styles.destinationMarker}>
                            <Home size={18} color="#FFF" strokeWidth={2.5} />
                        </View>
                    </Marker>
                )}

                {agentLocation && (
                    <Marker coordinate={{ latitude: agentLocation.latitude!, longitude: agentLocation.longitude! }}>
                        <View style={styles.agentMarkerWrap}>
                            <Animated.View style={[styles.markerPulse, pulseStyle]} />
                            <LinearGradient colors={[Colors.primary, '#FF7A00']} style={styles.agentMarker}>
                                <Navigation2 size={16} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                            </LinearGradient>
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Bottom Intelligence Suite */}
            <View style={[styles.bottomSuite, { paddingBottom: insets.bottom + 10 }]}>
                <BlurView intensity={95} tint="light" style={styles.glassPanel}>
                    <View style={styles.dragHandle} />
                    
                    {/* Expert Status Card */}
                    {agent ? (
                        <View style={styles.expertCard}>
                            <View style={styles.expertAvatarWrap}>
                                <View style={styles.expertAvatar}>
                                    {agent.user?.avatarUrl ? (
                                        <Image source={{ uri: getImageUrl(agent.user.avatarUrl) || '' }} style={styles.avatarImg} />
                                    ) : (
                                        <User size={24} color={Colors.primary} />
                                    )}
                                </View>
                                <View style={styles.expertBadge}><ShieldCheck size={10} color="#FFF" fill={Colors.success} /></View>
                            </View>
                            <View style={styles.expertInfo}>
                                <Text style={styles.expertName}>{agent.user?.name?.toUpperCase() || 'EXPERT ALLOTTED'}</Text>
                                <View style={styles.ratingRow}>
                                    <Clock size={10} color="#94A3B8" />
                                    <Text style={styles.etaText}>ETA: 12 MINUTES</Text>
                                </View>
                            </View>
                            <View style={styles.actionRow}>
                                <Pressable style={styles.actionIcon} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (agent.phone) Linking.openURL(`tel:${agent.phone}`); }}>
                                    <Phone size={18} color="#FFF" fill="#FFF" />
                                </Pressable>
                                <Pressable style={[styles.actionIcon, { backgroundColor: '#0F172A' }]}>
                                    <MessageSquare size={18} color="#FFF" />
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.scanningBox}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                            <Text style={styles.scanningText}>SCANNING FOR NEAREST EXPERT...</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Mission Timeline */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
                        {STATUS_STEPS.map((step, index) => {
                            const isDone = index <= currentStatusIndex;
                            const isNext = index === currentStatusIndex + 1;
                            const isCurrent = index === currentStatusIndex;
                            return (
                                <View key={step.key} style={styles.stepItem}>
                                    <View style={[styles.stepOrb, isDone && styles.stepOrbActive, isCurrent && styles.stepOrbCurrent]}>
                                        <step.icon size={16} color={isDone ? "#FFF" : "#CBD5E1"} strokeWidth={3} />
                                    </View>
                                    <Text style={[styles.stepLabel, isDone && styles.stepLabelActive]}>{step.label}</Text>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <View style={[styles.connector, index < currentStatusIndex && styles.connectorActive]} />
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Verification Protocol */}
                    {booking.status === 'IN_PROGRESS' && (booking as any).completionOtp && (
                        <Animated.View entering={FadeInUp} style={styles.otpBanner}>
                            <LinearGradient colors={[Colors.primary + '15', Colors.primary + '05']} style={styles.otpGradient}>
                                <View style={styles.otpHeader}>
                                    <ShieldCheck size={16} color={Colors.primary} strokeWidth={3} />
                                    <Text style={styles.otpLabel}>FIELD VERIFICATION CODE</Text>
                                </View>
                                <Text style={styles.otpValue}>{(booking as any).completionOtp}</Text>
                                <Text style={styles.otpSub}>Share with expert only upon successful completion.</Text>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </BlurView>
            </View>
        </View>
    );
}

const mapStyle = [
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 1 },

    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    headerSub: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
    oracleBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    // Markers
    destinationMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    agentMarkerWrap: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    markerPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary + '40' },
    agentMarker: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },

    // Bottom Suite
    bottomSuite: { position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 100 },
    glassPanel: { borderRadius: 36, overflow: 'hidden', padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    dragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

    expertCard: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    expertAvatarWrap: { position: 'relative' },
    expertAvatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    expertBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 8, padding: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    expertInfo: { flex: 1 },
    expertName: { fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    etaText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },

    scanningBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary + '08', padding: 15, borderRadius: 18 },
    scanningText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    divider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 25 },

    timelineScroll: { paddingRight: 20, gap: 20 },
    stepItem: { alignItems: 'center', width: 90, position: 'relative' },
    stepOrb: { width: 44, height: 44, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', zIndex: 2, borderWidth: 2, borderColor: '#FFF' },
    stepOrbActive: { backgroundColor: Colors.primary },
    stepOrbCurrent: { borderWidth: 3, borderColor: Colors.primary + '30' },
    stepLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginTop: 10, textAlign: 'center' },
    stepLabelActive: { color: '#0F172A' },
    connector: { position: 'absolute', top: 22, left: 65, width: 45, height: 2, backgroundColor: '#F1F5F9', zIndex: 1 },
    connectorActive: { backgroundColor: Colors.primary },

    otpBanner: { marginTop: 30, borderRadius: 24, overflow: 'hidden' },
    otpGradient: { padding: 20, alignItems: 'center' },
    otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    otpLabel: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
    otpValue: { fontSize: 32, fontWeight: '900', color: Colors.primary, letterSpacing: 8 },
    otpSub: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 5, textAlign: 'center' },
});
