import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, User, Phone, Calendar, IndianRupee,
    MapPin, UserPlus, Star, MessageCircle, X,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';
import type { Agent, MerchantOrderEvent } from '../../../lib/merchant';
import type { Booking } from '../../../lib/marketplace';

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#F59E0B', ACCEPTED: '#6366F1', AGENT_ASSIGNED: '#8B5CF6',
    EN_ROUTE: '#0EA5E9', ARRIVED: '#F97316', IN_PROGRESS: Colors.primary,
    COMPLETED: Colors.success, CANCELLED: '#EF4444', REJECTED: '#94A3B8',
};

type OrderDetail = Booking & { events: MerchantOrderEvent[]; agent: Agent | null };

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAssignAgent = async (agentId: string) => {
        setAssigning(true);
        setShowAgentPicker(false);
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await merchantApi.assignAgent(id, agentId);
            await fetchData();
            Alert.alert('Success', 'Agent assigned successfully');
        } catch {
            Alert.alert('Error', 'Failed to assign agent');
        } finally { setAssigning(false); }
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!order) return null;

    const canAssign = order.status === 'ACCEPTED' && !order.agent;
    const statusColor = STATUS_COLORS[order.status] || '#94A3B8';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{order.bookingNumber}</Text>
                    <View style={[styles.headerBadge, { backgroundColor: statusColor + '14' }]}>
                        <View style={[styles.headerDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.headerBadgeText, { color: statusColor }]}>
                            {order.status.replace(/_/g, ' ')}
                        </Text>
                    </View>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Customer Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                    <Text style={styles.cardLabel}>CUSTOMER</Text>
                    <View style={styles.customerRow}>
                        <View style={styles.customerAvatar}>
                            <User size={20} color={Colors.primary} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.customerName}>{order.customer?.name ?? 'Customer'}</Text>
                            {order.customer?.phone && (
                                <Pressable onPress={() => Linking.openURL(`tel:${order.customer!.phone}`)}>
                                    <View style={styles.phoneRow}>
                                        <Phone size={12} color={Colors.primary} strokeWidth={2} />
                                        <Text style={styles.phoneLink}>{order.customer.phone}</Text>
                                    </View>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </Animated.View>

                {/* Booking Info */}
                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.card}>
                    <Text style={styles.cardLabel}>BOOKING INFO</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoBlock}>
                            <View style={styles.infoIconRow}>
                                <Calendar size={14} color="#64748B" strokeWidth={2} />
                                <Text style={styles.infoBlockLabel}>Scheduled</Text>
                            </View>
                            <Text style={styles.infoBlockValue}>
                                {new Date(order.scheduledAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <View style={styles.infoIconRow}>
                                <IndianRupee size={14} color="#64748B" strokeWidth={2} />
                                <Text style={styles.infoBlockLabel}>Total</Text>
                            </View>
                            <Text style={[styles.infoBlockValue, { color: Colors.success }]}>
                                ₹{order.total.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Services */}
                {order.items && order.items.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
                        <Text style={styles.cardLabel}>SERVICES</Text>
                        {order.items.map((item) => (
                            <View key={item.id} style={styles.serviceRow}>
                                <Text style={styles.serviceName}>{item.service?.name ?? 'Service'}</Text>
                                <Text style={styles.serviceMeta}>×{item.quantity}  ₹{item.price}</Text>
                            </View>
                        ))}
                    </Animated.View>
                )}

                {/* Address */}
                {order.address && (
                    <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.card}>
                        <Text style={styles.cardLabel}>SERVICE ADDRESS</Text>
                        <View style={styles.addressRow}>
                            <MapPin size={16} color="#EF4444" strokeWidth={2} />
                            <Text style={styles.addressText}>
                                {[order.address.line1, order.address.city, order.address.state, order.address.zipCode].filter(Boolean).join(', ')}
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* Agent */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                    <Text style={styles.cardLabel}>FIELD AGENT</Text>
                    {order.agent ? (
                        <View style={styles.customerRow}>
                            <View style={[styles.customerAvatar, { backgroundColor: '#EEF2FF' }]}>
                                <User size={20} color="#6366F1" strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.customerName}>{order.agent.user?.name ?? 'Agent'}</Text>
                                <View style={[styles.agentBadge, { backgroundColor: (order.agent.status === 'AVAILABLE' ? Colors.success : '#F59E0B') + '14' }]}>
                                    <Text style={[styles.agentBadgeText, { color: order.agent.status === 'AVAILABLE' ? Colors.success : '#F59E0B' }]}>
                                        {order.agent.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.noAgent}>No agent assigned yet</Text>
                    )}

                    {canAssign && (
                        <Pressable
                            onPress={() => setShowAgentPicker(true)}
                            disabled={assigning}
                            style={({ pressed }) => [styles.assignBtn, pressed && { opacity: 0.8 }, assigning && { opacity: 0.5 }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.assignGradient}
                            >
                                {assigning ? <ActivityIndicator size="small" color="#FFF" /> : (
                                    <>
                                        <UserPlus size={16} color="#FFF" strokeWidth={2.5} />
                                        <Text style={styles.assignText}>Assign Agent</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    )}
                </Animated.View>

                {/* Agent Picker */}
                {showAgentPicker && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.card}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.cardLabel}>SELECT AGENT</Text>
                            <Pressable onPress={() => setShowAgentPicker(false)}>
                                <X size={18} color="#94A3B8" strokeWidth={2} />
                            </Pressable>
                        </View>
                        {agents.length === 0 ? (
                            <Text style={styles.noAgent}>No available agents</Text>
                        ) : (
                            agents.map((agent) => (
                                <Pressable
                                    key={agent.id}
                                    onPress={() => handleAssignAgent(agent.id)}
                                    style={({ pressed }) => [styles.agentOption, pressed && { backgroundColor: '#EFF6FF' }]}
                                >
                                    <View>
                                        <Text style={styles.agentOptName}>{agent.user?.name ?? 'Agent'}</Text>
                                        <Text style={styles.agentOptSkills}>{agent.skills.join(', ') || 'No skills'}</Text>
                                    </View>
                                    <View style={styles.ratingPill}>
                                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                        <Text style={styles.ratingPillText}>{agent.rating.toFixed(1)}</Text>
                                    </View>
                                </Pressable>
                            ))
                        )}
                    </Animated.View>
                )}

                {/* Timeline */}
                {order.events && order.events.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.card}>
                        <Text style={styles.cardLabel}>TIMELINE</Text>
                        {order.events.map((event, idx) => (
                            <View key={event.id} style={styles.tlRow}>
                                <View style={styles.tlLeft}>
                                    <View style={[styles.tlDot, { backgroundColor: idx === 0 ? Colors.primary : '#E2E8F0' }]} />
                                    {idx < order.events.length - 1 && <View style={styles.tlLine} />}
                                </View>
                                <View style={styles.tlContent}>
                                    <Text style={styles.tlStatus}>{event.status.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.tlMeta}>
                                        {event.actor?.name ?? 'System'} · {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {!!event.note && <Text style={styles.tlNote}>{event.note}</Text>}
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                )}

                {/* Chat CTA */}
                {!['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.status) && (
                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <Pressable
                            onPress={() => router.push(`/(merchant)/chat/${order.id}` as never)}
                            style={({ pressed }) => [styles.chatBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#818CF8']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.chatGradient}
                            >
                                <MessageCircle size={18} color="#FFF" strokeWidth={2} />
                                <Text style={styles.chatBtnText}>Chat with Customer</Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    headerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 4,
    },
    headerDot: { width: 6, height: 6, borderRadius: 3 },
    headerBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    scroll: { padding: Spacing.lg, gap: 12, paddingBottom: 40 },

    // Cards
    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    cardLabel: {
        fontSize: 11, fontWeight: '800', color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
    },

    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    customerAvatar: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center',
    },
    customerName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    phoneLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

    infoGrid: { flexDirection: 'row', gap: 12 },
    infoBlock: {
        flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    infoBlockLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
    infoBlockValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

    serviceRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    },
    serviceName: { fontSize: 14, color: '#0F172A', fontWeight: '600', flex: 1 },
    serviceMeta: { fontSize: 13, color: '#64748B', fontWeight: '700' },

    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    addressText: { fontSize: 13, color: '#64748B', fontWeight: '500', flex: 1, lineHeight: 20 },

    noAgent: { fontSize: 13, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
    agentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
    agentBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

    assignBtn: { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
    assignGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, gap: 8,
    },
    assignText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    agentOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 6,
    },
    agentOptName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    agentOptSkills: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    ratingPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    ratingPillText: { fontSize: 11, fontWeight: '800', color: '#D97706' },

    // Timeline
    tlRow: { flexDirection: 'row', gap: 12 },
    tlLeft: { alignItems: 'center', width: 16 },
    tlDot: { width: 10, height: 10, borderRadius: 5 },
    tlLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 2 },
    tlContent: { flex: 1, paddingBottom: 16 },
    tlStatus: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    tlMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    tlNote: { fontSize: 11, color: '#64748B', marginTop: 2, fontStyle: 'italic' },

    // Chat CTA
    chatBtn: { borderRadius: 16, overflow: 'hidden' },
    chatGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    chatBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
