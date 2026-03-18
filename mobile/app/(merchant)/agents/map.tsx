import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ChevronLeft, RefreshCw, User } from 'lucide-react-native';
import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';
import type { Agent } from '../../../lib/merchant';

export default function AgentLiveMapScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<MapView>(null);

    const fetchLocations = async () => {
        try {
            const { data } = await merchantApi.getAgentLiveLocations();
            setAgents(data.agents);
        } catch (error) {
            console.error('Failed to fetch agent locations', error);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (agents.length > 0 && mapRef.current) {
            const coordinates = agents
                .filter(a => a.lastLocationLat && a.lastLocationLng)
                .map(a => ({ latitude: a.lastLocationLat!, longitude: a.lastLocationLng! }));
            if (coordinates.length > 0) {
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 80, right: 50, bottom: 120, left: 50 },
                    animated: true,
                });
            }
        }
    }, [agents]);

    const getMarkerColor = (agent: Agent) => {
        if (agent.bookings && agent.bookings.length > 0) return '#F59E0B';
        return Colors.success;
    };

    const availableCount = agents.filter(a => !a.bookings?.length).length;
    const busyCount = agents.filter(a => a.bookings?.length).length;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {loading && agents.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: agents[0]?.lastLocationLat ?? 37.78825,
                        longitude: agents[0]?.lastLocationLng ?? -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {agents.map((agent) => {
                        if (!agent.lastLocationLat || !agent.lastLocationLng) return null;
                        const isBusy = agent.bookings && agent.bookings.length > 0;
                        const currentOrder = isBusy ? agent.bookings![0] : null;

                        return (
                            <Marker
                                key={agent.id}
                                coordinate={{ latitude: agent.lastLocationLat, longitude: agent.lastLocationLng }}
                            >
                                <View style={[styles.markerOuter, { borderColor: getMarkerColor(agent) }]}>
                                    <View style={[styles.markerInner, { backgroundColor: getMarkerColor(agent) }]}>
                                        <User size={14} color="#FFF" strokeWidth={2.5} />
                                    </View>
                                </View>
                                <Callout tooltip style={styles.calloutWrap}>
                                    <View style={styles.calloutBubble}>
                                        <Text style={styles.calloutName}>{agent.user?.name || 'Agent'}</Text>
                                        <Text style={styles.calloutStatus}>
                                            {isBusy ? 'En Route / Working' : 'Available'}
                                        </Text>
                                        {currentOrder && (
                                            <Text style={styles.calloutOrder}>
                                                Job: #{currentOrder.bookingNumber}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.calloutArrow} />
                                </Callout>
                            </Marker>
                        );
                    })}
                </MapView>
            )}

            {/* Back Button */}
            <Pressable
                onPress={() => router.back()}
                style={[styles.backBtn, { top: insets.top + 10 }]}
            >
                <ChevronLeft size={22} color="#1E293B" />
            </Pressable>

            {/* Title Chip */}
            <View style={[styles.titleChip, { top: insets.top + 12 }]}>
                <Text style={styles.titleChipText}>Live Map</Text>
            </View>

            {/* Bottom Overlay */}
            <View style={[styles.overlay, { bottom: insets.bottom + 20 }]}>
                <View style={styles.statGroup}>
                    <View style={styles.statItem}>
                        <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.statLabel}>Available ({availableCount})</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.statLabel}>Busy ({busyCount})</Text>
                    </View>
                </View>
                <Pressable
                    onPress={fetchLocations}
                    style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
                >
                    <RefreshCw size={18} color={Colors.primary} strokeWidth={2} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },

    // Header Controls
    backBtn: {
        position: 'absolute', left: 16,
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    titleChip: {
        position: 'absolute', alignSelf: 'center',
        backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    titleChipText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

    // Markers
    markerOuter: {
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 3, backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
    },
    markerInner: {
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },

    calloutWrap: { width: 200, alignItems: 'center' },
    calloutBubble: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 14, width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
    },
    calloutName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    calloutStatus: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 2 },
    calloutOrder: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
    calloutArrow: {
        width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
        borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'white',
        transform: [{ rotate: '180deg' }], marginTop: -1,
    },

    // Bottom Overlay
    overlay: {
        position: 'absolute', left: 16, right: 16,
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    statGroup: { gap: 8 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statDot: { width: 10, height: 10, borderRadius: 5 },
    statLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    refreshBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: Colors.primary + '12',
        justifyContent: 'center', alignItems: 'center',
    },
});
