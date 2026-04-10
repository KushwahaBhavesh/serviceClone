import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
    ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing } from '../../../constants/theme';
import { useToast } from '../../../context/ToastContext';
import EmptyState from '../../../components/shared/EmptyState';
import api from '../../../lib/api';

type FilterKey = 'ALL' | 'CREDIT' | 'DEBIT';
const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'CREDIT', label: 'Credits' },
    { key: 'DEBIT', label: 'Debits' },
];

interface WalletTx {
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
}

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const { showError } = useToast();

    const [transactions, setTransactions] = useState<WalletTx[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterKey>('ALL');

    const fetchData = useCallback(async () => {
        try {
            const { data } = await api.get<{ wallet: { balance: number; transactions: WalletTx[] } }>('/customer/wallet');
            setTransactions(data.wallet?.transactions ?? []);
        } catch { showError('Failed to load transactions'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter);

    const renderTx = useCallback(({ item, index }: { item: WalletTx; index: number }) => {
        const isCredit = item.type === 'CREDIT';
        const date = new Date(item.createdAt);
        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 50).springify()}>
                <View style={styles.txCard}>
                    <View style={[styles.txIcon, { backgroundColor: isCredit ? '#F0FDF4' : '#FEF2F2' }]}>
                        {isCredit ? (
                            <ArrowDownLeft size={16} color="#22C55E" strokeWidth={2.5} />
                        ) : (
                            <ArrowUpRight size={16} color="#EF4444" strokeWidth={2.5} />
                        )}
                    </View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txDesc} numberOfLines={1}>{item.description || (isCredit ? 'Wallet Top-up' : 'Payment')}</Text>
                        <Text style={styles.txDate}>
                            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View style={styles.txAmountCol}>
                        <Text style={[styles.txAmount, { color: isCredit ? '#22C55E' : '#EF4444' }]}>
                            {isCredit ? '+' : '-'}₹{item.amount?.toFixed(0)}
                        </Text>
                        <Text style={styles.txBalance}>Bal: ₹{item.balanceAfter?.toFixed(0)}</Text>
                    </View>
                </View>
            </Animated.View>
        );
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                    >
                        <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderTx}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[Colors.primary]} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="wallet-outline"
                            title="No transactions yet"
                            subtitle="Your wallet transactions will appear here"
                        />
                    }
                />
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
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    filterRow: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: Spacing.lg, paddingVertical: 12,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    filterPill: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    },
    filterPillActive: { backgroundColor: Colors.primary + '14', borderColor: Colors.primary },
    filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    filterTextActive: { color: Colors.primary, fontWeight: '700' },

    list: { padding: Spacing.lg, paddingBottom: 40, gap: 8 },

    txCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFF', borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
    },
    txIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    txDate: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 3 },
    txAmountCol: { alignItems: 'flex-end' },
    txAmount: { fontSize: 15, fontWeight: '800' },
    txBalance: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
});
