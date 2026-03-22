import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, Receipt, TrendingUp, IndianRupee,
    CheckCircle, Wallet,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { Earnings } from '../../lib/merchant';
import type { Booking } from '../../lib/marketplace';

type PeriodKey = 'day' | 'week' | 'month';
const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
];

export default function EarningsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [period, setPeriod] = useState<PeriodKey>('month');
    const [data, setData] = useState<Earnings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEarnings = useCallback(async () => {
        try {
            const res = await merchantApi.getEarnings({ period });
            setData(res.data);
        } catch { Alert.alert('Error', 'Failed to load earnings'); }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { setLoading(true); fetchEarnings(); }, [fetchEarnings]);

    const onRefresh = () => { setRefreshing(true); fetchEarnings().finally(() => setRefreshing(false)); };

    const stats = [
        { icon: <Receipt size={18} color={Colors.primary} strokeWidth={2} />, iconBg: Colors.primary + '12', value: `₹${(data?.earnings.subtotal ?? 0).toLocaleString()}`, label: 'Subtotal' },
        { icon: <IndianRupee size={18} color="#F59E0B" strokeWidth={2} />, iconBg: '#FEF3C7', value: `₹${(data?.earnings.taxCollected ?? 0).toLocaleString()}`, label: 'Tax' },
        {
            icon: <TrendingUp size={18} color={Colors.success} strokeWidth={2} />, iconBg: '#ECFDF5',
            value: data?.earnings.orderCount ? `₹${Math.round((data.earnings.totalRevenue ?? 0) / data.earnings.orderCount).toLocaleString()}` : '—',
            label: 'Avg Order',
        },
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Earnings</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Period Filter */}
            <View style={styles.filterBar}>
                {PERIODS.map(({ key, label }) => {
                    const isActive = period === key;
                    return (
                        <Pressable
                            key={key}
                            onPress={() => { setPeriod(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
                >
                    {/* Hero */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
                            <Text style={styles.heroAmount}>₹{(data?.earnings.totalRevenue ?? 0).toLocaleString()}</Text>
                            <Text style={styles.heroSub}>{data?.earnings.orderCount ?? 0} completed orders</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
                        {stats.map((s) => (
                            <View key={s.label} style={styles.statCard}>
                                <View style={[styles.statIconBox, { backgroundColor: s.iconBg }]}>
                                    {s.icon}
                                </View>
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Transactions */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.txnCard}>
                        <Text style={styles.txnSectionTitle}>COMPLETED ORDERS</Text>
                        {(data?.bookings ?? []).length === 0 ? (
                            <View style={styles.empty}>
                                <View style={styles.emptyIconBox}>
                                    <Wallet size={28} color="#CBD5E1" strokeWidth={1.5} />
                                </View>
                                <Text style={styles.emptyTitle}>No completed orders</Text>
                                <Text style={styles.emptyHint}>Orders in this period will appear here</Text>
                            </View>
                        ) : (
                            (data?.bookings ?? []).map((booking: Booking) => (
                                <View key={booking.id} style={styles.txnRow}>
                                    <View style={styles.txnIcon}>
                                        <CheckCircle size={18} color={Colors.success} strokeWidth={2} />
                                    </View>
                                    <View style={styles.txnInfo}>
                                        <Text style={styles.txnTitle}>{booking.bookingNumber}</Text>
                                        <Text style={styles.txnDate}>
                                            {booking.completedAt
                                                ? new Date(booking.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </Text>
                                    </View>
                                    <Text style={styles.txnAmount}>+₹{booking.total.toLocaleString()}</Text>
                                </View>
                            ))
                        )}
                    </Animated.View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    filterBar: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
    filterChip: {
        flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9',
    },
    filterChipActive: {
        backgroundColor: Colors.primary, borderColor: Colors.primary,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    filterText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    filterTextActive: { color: '#FFF' },

    scroll: { padding: Spacing.lg, gap: 12, paddingBottom: 40 },

    heroCard: {
        borderRadius: 20, padding: 24, alignItems: 'center',
    },
    heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
    heroAmount: { fontSize: 36, fontWeight: '900', color: '#FFF', marginTop: 4 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 4 },

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    statIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    statValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

    txnCard: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    txnSectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 12 },
    txnRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    },
    txnIcon: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.success + '12',
        justifyContent: 'center', alignItems: 'center',
    },
    txnInfo: { flex: 1 },
    txnTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    txnDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    txnAmount: { fontSize: 15, fontWeight: '800', color: Colors.success },

    empty: { alignItems: 'center', paddingVertical: 30, gap: 6 },
    emptyIconBox: {
        width: 56, height: 56, borderRadius: 18, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
    emptyHint: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
});
