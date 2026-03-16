import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { customerApi, type WalletTransaction } from '../../../lib/marketplace';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
    const router = useRouter();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWalletData = useCallback(async () => {
        try {
            const { data } = await customerApi.getWallet();
            setBalance(data.balance);
            setTransactions(data.transactions);
        } catch (err) {
            console.error('Failed to fetch wallet data:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const renderTransaction = ({ item }: { item: WalletTransaction }) => {
        const isCredit = ['TOPUP', 'REFUND'].includes(item.type);
        const iconName = item.type === 'TOPUP' ? 'add-circle' :
            item.type === 'PAYMENT' ? 'cart' :
                item.type === 'REFUND' ? 'refresh-circle' : 'swap-horizontal';

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.iconBox, { backgroundColor: isCredit ? Colors.success + '15' : Colors.error + '15' }]}>
                    <Ionicons name={iconName as any} size={20} color={isCredit ? Colors.success : Colors.error} />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{item.description || item.type}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: isCredit ? Colors.success : Colors.text }]}>
                    {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Wallet Card */}
            <View style={styles.cardContainer}>
                <View style={styles.walletCard}>
                    <View style={styles.cardHighlight} />
                    <View style={styles.cardContent}>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

                        <View style={styles.cardActionRow}>
                            <Pressable style={styles.cardActionBtn}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.cardActionText}>Add Money</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>

            {/* Transactions Section */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Transaction History</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderTransaction}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        width: 44, height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    cardContainer: { padding: Spacing.lg },
    walletCard: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xxl || 24, // Use xxl or fallback
        overflow: 'hidden',
        padding: Spacing.xl,
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardHighlight: {
        position: 'absolute',
        top: -50, right: -50,
        width: 150, height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    cardContent: { zIndex: 1 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '600' },
    balanceAmount: { color: 'white', fontSize: 36, fontWeight: '900', marginVertical: Spacing.xs },
    cardActionRow: { flexDirection: 'row', marginTop: Spacing.md },
    cardActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    cardActionText: { color: 'white', fontWeight: '700', fontSize: FontSize.sm },
    historySection: { flex: 1, paddingHorizontal: Spacing.lg },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
    listContent: { paddingBottom: Spacing.xxl + 20 },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    iconBox: {
        width: 44, height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionDetails: { flex: 1, marginLeft: Spacing.md },
    transactionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    transactionDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    transactionAmount: { fontSize: FontSize.md, fontWeight: '800' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
