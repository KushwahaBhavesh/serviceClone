import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';
import type { Agent } from '../../../lib/merchant';

export default function AgentLiveMapScreen() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<MapView>(null);

    const fetchLocations = async () => {
        try {
            const { data } = await merchantApi.getAgentLiveLocations();
            setAgents(data.agents);
        } catch (error) {
            console.error('Failed to fetch agent locations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Fit map to markers when agents change
    useEffect(() => {
        if (agents.length > 0 && mapRef.current) {
            const coordinates = agents
                .filter(a => a.lastLocationLat && a.lastLocationLng)
                .map(a => ({
                    latitude: a.lastLocationLat!,
                    longitude: a.lastLocationLng!
                }));

            if (coordinates.length > 0) {
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        }
    }, [agents]);

    const getAgentMarkerColor = (agent: Agent) => {
        if (agent.bookings && agent.bookings.length > 0) return Colors.warning; // Busy on order
        return Colors.success; // Available
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Agent Live Map',
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                }}
            />

            {loading && agents.length === 0 ? (
                <View style={styles.loadingContainer}>
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
                                coordinate={{
                                    latitude: agent.lastLocationLat,
                                    longitude: agent.lastLocationLng,
                                }}
                            >
                                <View style={[styles.markerPin, { backgroundColor: getAgentMarkerColor(agent) }]}>
                                    <Ionicons name="person" size={16} color="white" />
                                </View>
                                <Callout tooltip style={styles.calloutContainer}>
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

            {/* Quick Stats Overlay */}
            <View style={styles.overlayBar}>
                <View style={styles.statBox}>
                    <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.statText}>Available ({agents.filter(a => !a.bookings?.length).length})</Text>
                </View>
                <View style={styles.statBox}>
                    <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.statText}>Busy ({agents.filter(a => a.bookings?.length).length})</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchLocations}>
                    <Ionicons name="refresh" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    markerPin: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutContainer: {
        width: 180,
        alignItems: 'center',
    },
    calloutBubble: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    calloutName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    calloutStatus: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 2,
    },
    calloutOrder: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
    calloutArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
        transform: [{ rotate: '180deg' }],
        marginTop: -1,
    },
    overlayBar: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    refreshBtn: {
        padding: 8,
        backgroundColor: Colors.primary + '15',
        borderRadius: 8,
    },
});
