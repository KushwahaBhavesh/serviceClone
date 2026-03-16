import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
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
    const [period, setPeriod] = useState<PeriodKey>('month');
    const [data, setData] = useState<Earnings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = useCallback(async () => {
        try {
            const res = await merchantApi.getEarnings({ period });
            setData(res.data);
        } catch {
            Alert.alert('Error', 'Failed to load earnings');
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        setLoading(true);
        fetchEarnings();
    }, [fetchEarnings]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Earnings</Text>

            <View style={styles.periodBar}>
                {PERIODS.map(({ key, label }) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.periodBtn, period === key && styles.periodBtnActive]}
                        onPress={() => setPeriod(key)}
                    >
                        <Text style={[styles.periodText, period === key && styles.periodTextActive]}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLabel}>Total Revenue</Text>
                        <Text style={styles.heroAmount}>₹{(data?.earnings.totalRevenue ?? 0).toLocaleString()}</Text>
                        <Text style={styles.heroSub}>{data?.earnings.orderCount ?? 0} completed orders</Text>
                    </View>

                    <View style={styles.statsRow}>
                        {[
                            { icon: 'receipt' as const, value: `₹${(data?.earnings.subtotal ?? 0).toLocaleString()}`, label: 'Subtotal', color: Colors.primary },
                            { icon: 'cash' as const, value: `₹${(data?.earnings.taxCollected ?? 0).toLocaleString()}`, label: 'Tax Collected', color: Colors.warning },
                            {
                                icon: 'trending-up' as const,
                                value: data?.earnings.orderCount ? `₹${Math.round((data.earnings.totalRevenue ?? 0) / data.earnings.orderCount).toLocaleString()}` : '—',
                                label: 'Avg Order',
                                color: Colors.success,
                            },
                        ].map((s) => (
                            <View key={s.label} style={styles.statCard}>
                                <Ionicons name={s.icon} size={20} color={s.color} />
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.txnSection}>
                        <Text style={styles.sectionTitle}>Completed Orders</Text>
                        {(data?.bookings ?? []).length === 0 ? (
                            <View style={styles.empty}>
                                <Ionicons name="wallet" size={48} color={Colors.textMuted} />
                                <Text style={styles.emptyText}>No completed orders in this period</Text>
                            </View>
                        ) : (
                            (data?.bookings ?? []).map((booking: Booking) => (
                                <View key={booking.id} style={styles.txnRow}>
                                    <View style={styles.txnIcon}>
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
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
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    periodBar: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    periodBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface },
    periodBtnActive: { backgroundColor: Colors.primary },
    periodText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
    periodTextActive: { color: Colors.textOnPrimary },
    scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
    heroCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center' },
    heroLabel: { fontSize: FontSize.sm, color: Colors.textOnPrimary + 'CC', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    heroAmount: { fontSize: 36, fontWeight: '900', color: Colors.textOnPrimary, marginTop: 4 },
    heroSub: { fontSize: FontSize.sm, color: Colors.textOnPrimary + 'BB', marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
    statValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
    txnSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md },
    sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
    txnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    txnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.success + '15', justifyContent: 'center', alignItems: 'center' },
    txnInfo: { flex: 1 },
    txnTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    txnDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    txnAmount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },
    empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
