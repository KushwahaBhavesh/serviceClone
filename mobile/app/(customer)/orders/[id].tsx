import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Linking, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
    ChevronLeft, MapPin, Clock, Calendar,
    CheckCircle, XCircle, Phone, MessageSquare,
    Star, RefreshCw, Navigation, User as UserIcon,
    IndianRupee, Package, ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { bookingApi, type Booking } from '../../../lib/marketplace';
import { useToast } from '../../../context/ToastContext';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: '#F59E0B', bg: '#FFFBEB', label: 'Pending' },
    ACCEPTED: { color: '#3B82F6', bg: '#EFF6FF', label: 'Confirmed' },
    AGENT_ASSIGNED: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Agent Assigned' },
    EN_ROUTE: { color: '#6366F1', bg: '#EEF2FF', label: 'En Route' },
    ARRIVED: { color: '#6366F1', bg: '#EEF2FF', label: 'Arrived' },
    IN_PROGRESS: { color: Colors.primary, bg: Colors.primary + '14', label: 'In Progress' },
    COMPLETED: { color: '#22C55E', bg: '#F0FDF4', label: 'Completed' },
    CANCELLED: { color: '#EF4444', bg: '#FEF2F2', label: 'Cancelled' },
    REJECTED: { color: '#6B7280', bg: '#F3F4F6', label: 'Rejected' },
};

const TIMELINE_ORDER = ['PENDING', 'ACCEPTED', 'AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED'];

export default function OrderDetailScreen() {
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { showError, showSuccess } = useToast();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchBooking = useCallback(async () => {
        try {
            const { data } = await bookingApi.getBooking(id!);
            setBooking(data.booking);
        } catch { showError('Failed to load order'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [id]);

    useEffect(() => { fetchBooking(); }, [fetchBooking]);

    const handleCancel = () => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'Keep Booking', style: 'cancel' },
            {
                text: 'Cancel', style: 'destructive', onPress: async () => {
                    setCancelling(true);
                    try {
                        await bookingApi.updateStatus(id!, { status: 'CANCELLED' });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        showSuccess('Booking cancelled');
                        fetchBooking();
                    } catch { showError('Failed to cancel'); }
                    finally { setCancelling(false); }
                },
            },
        ]);
    };

    if (loading) {
        return <View style={[styles.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (!booking) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>Order not found</Text>
                <Pressable onPress={() => router.back()} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
    const currentStep = TIMELINE_ORDER.indexOf(booking.status);
    const isTerminal = TERMINAL_STATUSES.includes(booking.status);
    const canCancel = ['PENDING', 'ACCEPTED'].includes(booking.status);
    const canReview = booking.status === 'COMPLETED';
    const canTrack = ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(booking.status);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooking(); }} colors={[Colors.primary]} />}
            >
                {/* Status Banner */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
                        <View style={styles.statusLeft}>
                            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                            <View>
                                <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                                <Text style={styles.bookingId}>#{booking.bookingNumber}</Text>
                            </View>
                        </View>
                        {canTrack && (
                            <Pressable
                                onPress={() => router.push(`/(booking)/tracking/${id}` as any)}
                                style={styles.trackBtn}
                            >
                                <Navigation size={14} color="#FFF" strokeWidth={2.5} />
                                <Text style={styles.trackText}>Track</Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>

                {/* Service Summary */}
                <Animated.View entering={FadeInDown.delay(150).springify()}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Package size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.cardTitle}>Service</Text>
                        </View>
                        {booking.merchant && (
                            <View style={styles.merchantRow}>
                                <View style={styles.avatarSmall}>
                                    <Text style={styles.avatarInit}>{booking.merchant.name?.[0]?.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.merchantName}>{booking.merchant.name}</Text>
                            </View>
                        )}

                        {/* Items */}
                        {booking.items?.map((item, i) => (
                            <View key={i} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.service?.name ?? 'Service'}</Text>
                                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                                </View>
                                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
                            </View>
                        ))}

                        {/* Schedule */}
                        <View style={styles.scheduleRow}>
                            <View style={styles.scheduleItem}>
                                <Calendar size={13} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.scheduleText}>
                                    {new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.scheduleItem}>
                                <Clock size={13} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.scheduleText}>
                                    {new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>

                        {booking.address && (
                            <View style={styles.addressRow}>
                                <MapPin size={13} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {[booking.address.street, booking.address.city].filter(Boolean).join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Agent Card */}
                {booking.agent && (
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <UserIcon size={16} color={Colors.primary} strokeWidth={2} />
                                <Text style={styles.cardTitle}>Assigned Agent</Text>
                            </View>
                            <View style={styles.agentRow}>
                                <View style={styles.agentAvatar}>
                                    <Text style={styles.agentInit}>
                                        {booking.agent.user?.name?.[0]?.toUpperCase() ?? 'A'}
                                    </Text>
                                </View>
                                <View style={styles.agentInfo}>
                                    <Text style={styles.agentName}>{booking.agent.user?.name ?? 'Agent'}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Payment Summary */}
                <Animated.View entering={FadeInDown.delay(250).springify()}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <IndianRupee size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.cardTitle}>Payment</Text>
                        </View>
                        <View style={styles.payRow}>
                            <Text style={styles.payLabel}>Subtotal</Text>
                            <Text style={styles.payValue}>₹{booking.subtotal?.toFixed(0) ?? '0'}</Text>
                        </View>
                        <View style={styles.payRow}>
                            <Text style={styles.payLabel}>Tax</Text>
                            <Text style={styles.payValue}>₹{booking.tax?.toFixed(0) ?? '0'}</Text>
                        </View>
                        <View style={[styles.payRow, styles.payTotal]}>
                            <Text style={styles.payTotalLabel}>Total</Text>
                            <Text style={styles.payTotalValue}>₹{booking.total?.toFixed(0) ?? '0'}</Text>
                        </View>
                        <View style={styles.payStatusRow}>
                            <Text style={styles.payLabel}>Payment Status</Text>
                            <View style={[styles.payBadge, { backgroundColor: booking.paymentStatus === 'PAID' ? '#F0FDF4' : '#FFFBEB' }]}>
                                <Text style={[styles.payBadgeText, { color: booking.paymentStatus === 'PAID' ? '#22C55E' : '#F59E0B' }]}>
                                    {booking.paymentStatus}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Timeline */}
                {!['CANCELLED', 'REJECTED'].includes(booking.status) && (
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Clock size={16} color={Colors.primary} strokeWidth={2} />
                                <Text style={styles.cardTitle}>Order Timeline</Text>
                            </View>
                            {TIMELINE_ORDER.map((step, i) => {
                                const stepConfig = STATUS_CONFIG[step];
                                const isPast = i <= currentStep;
                                const isCurrent = i === currentStep;
                                const isLast = i === TIMELINE_ORDER.length - 1;
                                return (
                                    <View key={step} style={styles.timelineStep}>
                                        <View style={styles.timelineDotCol}>
                                            <View style={[
                                                styles.timelineDot,
                                                isPast && { backgroundColor: stepConfig.color },
                                                !isPast && { backgroundColor: '#E2E8F0' },
                                                isCurrent && { borderWidth: 3, borderColor: stepConfig.color + '40' },
                                            ]} />
                                            {!isLast && <View style={[styles.timelineLine, isPast && { backgroundColor: stepConfig.color + '30' }]} />}
                                        </View>
                                        <Text style={[
                                            styles.timelineLabel,
                                            isPast && { color: '#0F172A', fontWeight: '700' },
                                            isCurrent && { color: stepConfig.color, fontWeight: '800' },
                                        ]}>{stepConfig.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    {canCancel && (
                        <Pressable
                            onPress={handleCancel}
                            disabled={cancelling}
                            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
                        >
                            <XCircle size={16} color="#EF4444" strokeWidth={2} />
                            <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</Text>
                        </Pressable>
                    )}
                    {canReview && (
                        <Pressable
                            onPress={() => router.push(`/(customer)/reviews/add/${id}` as any)}
                            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF8533']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.reviewBtn}
                            >
                                <Star size={16} color="#FFF" strokeWidth={2} />
                                <Text style={styles.reviewText}>Write a Review</Text>
                            </LinearGradient>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 12 },
    content: { padding: Spacing.lg, paddingBottom: 100, gap: 12 },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    errorText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.primary + '12' },
    retryText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

    statusBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 18,
    },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    statusLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    bookingId: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
    trackBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    },
    trackText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

    card: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

    merchantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    avatarSmall: {
        width: 32, height: 32, borderRadius: 12,
        backgroundColor: Colors.primary + '14', justifyContent: 'center', alignItems: 'center',
    },
    avatarInit: { fontSize: 13, fontWeight: '800', color: Colors.primary },
    merchantName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    },
    itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    itemName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
    itemQty: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
    itemPrice: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

    scheduleRow: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    scheduleText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 8 },
    addressText: { fontSize: 12, fontWeight: '500', color: '#94A3B8', flex: 1 },

    agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    agentAvatar: {
        width: 44, height: 44, borderRadius: 16,
        backgroundColor: Colors.primary + '14', justifyContent: 'center', alignItems: 'center',
    },
    agentInit: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    agentInfo: { flex: 1 },
    agentName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

    payRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 6,
    },
    payLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
    payValue: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    payTotal: { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 6, paddingTop: 10 },
    payTotalLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    payTotalValue: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
    payStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    payBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    // Timeline
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    timelineDotCol: { alignItems: 'center', width: 16 },
    timelineDot: { width: 12, height: 12, borderRadius: 6 },
    timelineLine: { width: 2, height: 24, backgroundColor: '#E2E8F0', marginVertical: 2 },
    timelineLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8', paddingTop: 0 },

    actions: { gap: 10, marginTop: 4 },
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 16,
        borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
    reviewBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 16,
    },
    reviewText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
