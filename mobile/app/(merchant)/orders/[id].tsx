import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';
import type { Agent, MerchantOrderEvent } from '../../../lib/merchant';
import type { Booking } from '../../../lib/marketplace';

const STATUS_COLORS: Record<string, string> = {
    PENDING: Colors.warning,
    ACCEPTED: Colors.secondary,
    AGENT_ASSIGNED: '#9C27B0',
    EN_ROUTE: '#00BCD4',
    ARRIVED: '#FF9800',
    IN_PROGRESS: Colors.primary,
    COMPLETED: Colors.success,
    CANCELLED: Colors.error,
    REJECTED: Colors.textMuted,
};

type OrderDetail = Booking & { events: MerchantOrderEvent[]; agent: Agent | null };

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [showAgentPicker, setShowAgentPicker] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [orderRes, agentsRes] = await Promise.all([
                merchantApi.getOrder(id),
                merchantApi.listAgents(),
            ]);
            setOrder(orderRes.data.booking);
            setAgents(agentsRes.data.agents.filter((a) => a.status === 'AVAILABLE'));
        } catch {
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAssignAgent = async (agentId: string) => {
        setAssigning(true);
        setShowAgentPicker(false);
        try {
            await merchantApi.assignAgent(id, agentId);
            await fetchData();
            Alert.alert('Success', 'Agent assigned successfully');
        } catch {
            Alert.alert('Error', 'Failed to assign agent');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!order) return null;

    const canAssign = order.status === 'ACCEPTED' && !order.agent;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: order.bookingNumber, headerShown: true, headerStyle: { backgroundColor: Colors.backgroundAlt }, headerTintColor: Colors.text }} />
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Status Badge */}
                <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[order.status] + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
                    <Text style={[styles.statusLabel, { color: STATUS_COLORS[order.status] }]}>
                        {order.status.replace(/_/g, ' ')}
                    </Text>
                </View>

                {/* Customer */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Customer</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-circle" size={36} color={Colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{order.customer?.name ?? 'Customer'}</Text>
                            {order.customer?.phone && (
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer!.phone}`)}>
                                    <Text style={styles.link}>{order.customer.phone}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Schedule & Amount */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking Info</Text>
                    <View style={styles.row}>
                        <View style={styles.metaBlock}>
                            <Text style={styles.metaLabel}>Scheduled</Text>
                            <Text style={styles.metaValue}>
                                {new Date(order.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={styles.metaBlock}>
                            <Text style={styles.metaLabel}>Total</Text>
                            <Text style={[styles.metaValue, { color: Colors.success }]}>₹{order.total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Services */}
                {order.items && order.items.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Services</Text>
                        {order.items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.service?.name ?? 'Service'}</Text>
                                <Text style={styles.itemMeta}>×{item.quantity}  ₹{item.price}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Address */}
                {order.address && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Service Address</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={18} color={Colors.error} />
                            <Text style={styles.addressText}>
                                {[order.address.line1, order.address.city, order.address.state, order.address.zipCode].filter(Boolean).join(', ')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Assigned Agent */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Field Agent</Text>
                    {order.agent ? (
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={36} color={Colors.secondary} />
                            <View>
                                <Text style={styles.name}>{order.agent.user?.name ?? 'Agent'}</Text>
                                <View style={[styles.agentStatusPill, { backgroundColor: order.agent.status === 'AVAILABLE' ? Colors.success + '20' : Colors.warning + '20' }]}>
                                    <Text style={[styles.agentStatusText, { color: order.agent.status === 'AVAILABLE' ? Colors.success : Colors.warning }]}>{order.agent.status}</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No agent assigned yet</Text>
                    )}

                    {canAssign && (
                        <TouchableOpacity
                            style={[styles.assignBtn, assigning && { opacity: 0.6 }]}
                            onPress={() => setShowAgentPicker(true)}
                            disabled={assigning}
                        >
                            {assigning ? <ActivityIndicator size="small" color={Colors.textOnPrimary} /> :
                                <><Ionicons name="person-add" size={16} color={Colors.textOnPrimary} /><Text style={styles.assignBtnText}>Assign Agent</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </View>

                {/* Agent Picker */}
                {showAgentPicker && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Select Agent</Text>
                        {agents.length === 0 ? (
                            <Text style={styles.emptyText}>No available agents</Text>
                        ) : (
                            agents.map((agent) => (
                                <TouchableOpacity
                                    key={agent.id}
                                    style={styles.agentOption}
                                    onPress={() => handleAssignAgent(agent.id)}
                                >
                                    <View>
                                        <Text style={styles.agentName}>{agent.user?.name ?? 'Agent'}</Text>
                                        <Text style={styles.agentSkills}>{agent.skills.join(', ') || 'No skills listed'}</Text>
                                    </View>
                                    <View style={styles.ratingBadge}>
                                        <Ionicons name="star" size={12} color={Colors.warning} />
                                        <Text style={styles.ratingText}>{agent.rating.toFixed(1)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity style={styles.cancelPickerBtn} onPress={() => setShowAgentPicker(false)}>
                            <Text style={styles.cancelPickerText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Order Timeline */}
                {order.events && order.events.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Timeline</Text>
                        {order.events.map((event, idx) => (
                            <View key={event.id} style={styles.timelineRow}>
                                <View style={styles.timelineLine}>
                                    <View style={[styles.timelineDot, { backgroundColor: idx === 0 ? Colors.primary : Colors.border }]} />
                                    {idx < order.events.length - 1 && <View style={styles.timelineConnector} />}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineStatus}>{event.status.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.timelineMeta}>
                                        {event.actor?.name ?? 'System'} · {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {event.note && <Text style={styles.timelineNote}>{event.note}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Chat Action */}
                {!['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.status) && (
                    <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => router.push(`/(merchant)/chat/${order.id}` as never)}
                    >
                        <Ionicons name="chatbubbles" size={18} color={Colors.textOnPrimary} />
                        <Text style={styles.chatBtnText}>Chat with Customer</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusLabel: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },

    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
    cardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    link: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },

    row: { flexDirection: 'row', gap: Spacing.md },
    metaBlock: { flex: 1 },
    metaLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    metaValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginTop: 2 },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    itemName: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
    itemMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

    addressText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

    agentStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginTop: 4 },
    agentStatusText: { fontSize: FontSize.xs, fontWeight: '700' },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },

    assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
    assignBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textOnPrimary },

    agentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundAlt, marginBottom: 4 },
    agentName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    agentSkills: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
    ratingText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.warning },
    cancelPickerBtn: { alignItems: 'center', paddingTop: Spacing.sm },
    cancelPickerText: { fontSize: FontSize.sm, color: Colors.textSecondary },

    timelineRow: { flexDirection: 'row', gap: Spacing.sm },
    timelineLine: { alignItems: 'center', width: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5 },
    timelineConnector: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 2 },
    timelineContent: { flex: 1, paddingBottom: Spacing.md },
    timelineStatus: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    timelineMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    timelineNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },

    chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
    chatBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textOnPrimary },
});
