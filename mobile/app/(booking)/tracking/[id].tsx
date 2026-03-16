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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { bookingApi, type Booking } from '../../../lib/marketplace';
import { useSocket } from '../../../hooks/useSocket';

const { width, height } = Dimensions.get('window');

const STATUS_STEPS = [
    { key: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle' },
    { key: 'AGENT_ASSIGNED', label: 'Agent Assigned', icon: 'person' },
    { key: 'EN_ROUTE', label: 'En Route', icon: 'bicycle' },
    { key: 'ARRIVED', label: 'Arrived', icon: 'location' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: 'construct' },
    { key: 'COMPLETED', label: 'Completed', icon: 'star' },
];

export default function TrackingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);
    const { joinBooking, leaveBooking, onBookingUpdate, onAgentLocation } = useSocket();

    const fetchBookingDetails = useCallback(async () => {
        try {
            const { data } = await bookingApi.getBooking(id);
            setBooking(data.booking);

            // In a real app, agent location would come from a dedicated real-time socket or separate endpoint
            // For now, we simulate fetching it from the agent object if available in the booking
            const agent = (data.booking as any).agent;
            if (agent && agent.lastLocationLat && agent.lastLocationLng) {
                setAgentLocation({
                    latitude: agent.lastLocationLat,
                    longitude: agent.lastLocationLng,
                });
            }
        } catch (err) {
            console.error('Failed to fetch booking:', err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBookingDetails();
        if (id) {
            joinBooking(id as string);
        }
        return () => {
            if (id) leaveBooking(id as string);
        };
    }, [fetchBookingDetails, id, joinBooking, leaveBooking]);

    // Listen for real-time socket updates
    useEffect(() => {
        const cleanupStatus = onBookingUpdate((data) => {
            if (data.bookingId === id) {
                setBooking(prev => prev ? { ...prev, status: data.status as any } : prev);
            }
        });

        const cleanupLocation = onAgentLocation((data) => {
            setAgentLocation({ latitude: data.latitude, longitude: data.longitude });
        });

        return () => {
            cleanupStatus();
            cleanupLocation();
        };
    }, [id, onBookingUpdate, onAgentLocation]);

    useEffect(() => {
        if (mapRef.current && agentLocation && booking?.address?.latitude && booking?.address?.longitude) {
            mapRef.current.fitToCoordinates([
                agentLocation,
                { latitude: booking.address.latitude, longitude: booking.address.longitude }
            ], {
                edgePadding: { top: 100, right: 80, bottom: 300, left: 80 },
                animated: true,
            });
        }
    }, [agentLocation, booking]);

    if (isLoading && !booking) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Booking not found</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === booking.status);
    const agent = (booking as any).agent;

    return (
        <View style={styles.container}>
            {/* Header Overlay */}
            <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Tracking Order</Text>
                    <Text style={styles.headerSub}>#{booking.bookingNumber}</Text>
                </View>
            </SafeAreaView>

            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: booking.address?.latitude || 28.6273,
                    longitude: booking.address?.longitude || 77.3725,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* Destination Marker */}
                {booking.address?.latitude && booking.address?.longitude && (
                    <Marker
                        coordinate={{
                            latitude: booking.address.latitude!,
                            longitude: booking.address.longitude!,
                        }}
                        title="Service Location"
                    >
                        <View style={styles.destinationMarker}>
                            <Ionicons name="home" size={18} color="white" />
                        </View>
                    </Marker>
                )}

                {/* Agent Marker */}
                {agentLocation && (
                    <Marker
                        coordinate={agentLocation}
                        title="Your Service Expert"
                    >
                        <View style={styles.agentMarker}>
                            <Ionicons name="bicycle" size={20} color="white" />
                        </View>
                    </Marker>
                )}

                {/* Route Line (Simulated as straight line for now) */}
                {agentLocation && booking.address?.latitude && booking.address?.longitude && (
                    <Polyline
                        coordinates={[
                            agentLocation,
                            { latitude: booking.address.latitude!, longitude: booking.address.longitude! }
                        ]}
                        strokeColor={Colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[0]}
                    />
                )}
            </MapView>

            {/* Bottom Sheet Overlay */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                {/* Agent Info */}
                {agent ? (
                    <View style={styles.agentInfo}>
                        <View style={styles.agentAvatar}>
                            <Ionicons name="person" size={30} color={Colors.primary} />
                        </View>
                        <View style={styles.agentDetails}>
                            <Text style={styles.agentName}>{agent.user?.name || 'Assigned Agent'}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.ratingText}>4.9 · Service Expert</Text>
                            </View>
                        </View>
                        <Pressable style={styles.callBtn}>
                            <Ionicons name="call" size={20} color="white" />
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.searchingBox}>
                        <ActivityIndicator color={Colors.primary} size="small" />
                        <Text style={styles.searchingText}>Searching for best service expert...</Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* Status Timeline */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timelineScroll}
                >
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        return (
                            <View key={step.key} style={styles.timelineItem}>
                                <View style={[
                                    styles.stepCircle,
                                    isCompleted && styles.stepCircleActive,
                                    isCurrent && styles.stepCirclePulse
                                ]}>
                                    <Ionicons
                                        name={step.icon as any}
                                        size={20}
                                        color={isCompleted ? 'white' : Colors.textMuted}
                                    />
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    isCompleted && styles.stepLabelActive
                                ]}>{step.label}</Text>
                                {index < STATUS_STEPS.length - 1 && (
                                    <View style={[
                                        styles.stepLine,
                                        index < currentStatusIndex && styles.stepLineActive
                                    ]} />
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Completion OTP Alert */}
                {booking.status === 'IN_PROGRESS' && (booking as any).completionOtp && (
                    <View style={styles.otpAlert}>
                        <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
                        <View style={styles.otpContent}>
                            <Text style={styles.otpTitle}>Share OTP once complete</Text>
                            <Text style={styles.otpValue}>{(booking as any).completionOtp}</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: FontSize.md, color: Colors.error, marginBottom: Spacing.md },
    map: { width: width, height: height },
    headerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        zIndex: 10,
    },
    backBtn: {
        width: 44, height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerContent: { flex: 1, marginLeft: Spacing.md },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    headerSub: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
    destinationMarker: {
        width: 36, height: 36,
        borderRadius: 18,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3, borderColor: 'white',
    },
    agentMarker: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3, borderColor: 'white',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    dragHandle: {
        width: 40, height: 5,
        backgroundColor: Colors.border,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    agentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    agentAvatar: {
        width: 60, height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentDetails: { flex: 1, marginLeft: Spacing.md },
    agentName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingText: { fontSize: FontSize.sm, color: Colors.textMuted, marginLeft: 4 },
    callBtn: {
        width: 48, height: 48,
        borderRadius: 24,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.primary + '08',
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    searchingText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },
    timelineScroll: { paddingRight: Spacing.xl },
    timelineItem: { alignItems: 'center', width: 100, position: 'relative' },
    stepCircle: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    stepCircleActive: { backgroundColor: Colors.primary },
    stepCirclePulse: {
        borderWidth: 3,
        borderColor: Colors.primary + '40',
    },
    stepLabel: {
        marginTop: Spacing.sm,
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        textAlign: 'center',
    },
    stepLabelActive: { color: Colors.primary },
    stepLine: {
        position: 'absolute',
        top: 20, left: 70,
        width: 60, height: 3,
        backgroundColor: Colors.borderLight,
        zIndex: 1,
    },
    stepLineActive: { backgroundColor: Colors.primary },
    otpAlert: {
        marginTop: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.success + '08',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.success + '20',
    },
    otpContent: { flex: 1, marginLeft: Spacing.md },
    otpTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
    otpValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.success, letterSpacing: 4 },
});
