import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import {
    ChevronLeft,
    Plus,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    History,
    Sparkles,
    Check,
    X,
    CreditCard,
    ShieldCheck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { customerApi, paymentApi, type WalletTransaction } from '../../../lib/marketplace';
import { useToast } from '../../../context/ToastContext';
import { Input } from '../../../components/ui/Input';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();

    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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

    const handleAddBalance = async () => {
        const amount = parseFloat(addAmount);
        if (isNaN(amount) || amount < 100) {
            showInfo('Minimum top-up amount is ₹100.');
            return;
        }

        try {
            setIsSaving(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Create gateway order for wallet top-up
            const { data: topupData } = await paymentApi.walletTopup({ amount });

            if (topupData.gatewayConfig) {
                const config = topupData.gatewayConfig;
                const RazorpayCheckout = (await import('react-native-razorpay')).default;
                const sdkResult = await RazorpayCheckout.open({
                    key: config.key,
                    amount: config.amount,
                    currency: config.currency,
                    name: config.name,
                    description: config.description,
                    order_id: config.orderId,
                    theme: { color: '#FF5722' },
                });

                // Verify payment and credit wallet
                const { data: confirmData } = await paymentApi.walletConfirm({
                    transactionId: topupData.transactionId,
                    razorpay_payment_id: sdkResult.razorpay_payment_id,
                    razorpay_order_id: sdkResult.razorpay_order_id,
                    razorpay_signature: sdkResult.razorpay_signature,
                });

                setBalance(confirmData.newBalance);
                showSuccess(`${formatCurrency(amount)} added to your wallet!`);
                setIsAddModalVisible(false);
                setAddAmount('');
                fetchWalletData(); // Refresh transactions list
            }
        } catch (err: any) {
            if (err?.code === 'PAYMENT_CANCELLED') {
                showInfo('Top-up cancelled.');
            } else {
                showError(err?.description || err?.message || 'Top-up failed. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const renderTransaction = ({ item, index }: { item: WalletTransaction, index: number }) => {
        const isCredit = ['TOPUP', 'REFUND'].includes(item.type);
        const Icon = item.type === 'TOPUP' ? ArrowUpRight :
            item.type === 'PAYMENT' ? ArrowDownLeft :
                item.type === 'REFUND' ? RefreshCcw : History;
        const color = isCredit ? '#10B981' : '#64748B';

        return (
            <Animated.View entering={FadeInUp.delay(100 + index * 50).springify()}>
                <View style={styles.transactionCard}>
                    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                        <Icon size={18} color={color} strokeWidth={2.5} />
                    </View>
                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>{item.description || item.type.replace('_', ' ')}</Text>
                        <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.amountBox}>
                        <Text style={[styles.transactionAmount, { color: isCredit ? '#10B981' : '#0F172A' }]}>
                            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
                            <Text style={styles.statusText}>COMPLETED</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Sticky Oracle Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>EXECUTIVE WALLET</Text>
                        <Text style={styles.headerSubtitle}>Financial Core</Text>
                    </View>
                    <Animated.View entering={FadeInRight} style={styles.oracleBadge}>
                        <Sparkles size={12} color={Colors.primary} strokeWidth={3} />
                        <Text style={styles.oracleBadgeText}>ORACLE</Text>
                    </Animated.View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 80, paddingBottom: 140 }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Immersive Balance Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <LinearGradient
                        colors={[Colors.primary, '#FF7A00', Colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.balanceLabel}>LIQUID ASSETS</Text>
                                <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
                            </View>
                            <View style={styles.cardChipBox}>
                                <CreditCard size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                                <View style={styles.chipGraphic} />
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.verifiedBox}>
                                <ShieldCheck size={12} color="#FFF" strokeWidth={2.5} />
                                <Text style={styles.verifiedText}>SECURE ORACLE VAULT</Text>
                            </View>
                            <Pressable
                                onPress={() => setIsAddModalVisible(true)}
                                style={({ pressed }) => [
                                    styles.cardActionBtn,
                                    pressed && { transform: [{ scale: 0.95 }] }
                                ]}
                            >
                                <Plus size={18} color={Colors.primary} strokeWidth={3} />
                                <Text style={styles.cardActionText}>TOP UP</Text>
                            </Pressable>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Transaction History Section */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeader}>
                        <History size={16} color="#94A3B8" strokeWidth={2.5} />
                        <Text style={styles.sectionTitle}>TRANSACTION LOGS</Text>
                    </View>

                    {isLoading ? (
                        <View style={styles.loaderBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : transactions.length === 0 ? (
                        <Animated.View entering={FadeInUp} style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <History size={48} color="#CBD5E1" strokeWidth={1} />
                            </View>
                            <Text style={styles.emptyText}>NO DATA LOGGED</Text>
                            <Text style={styles.emptySubText}>All your financial activity will appear here.</Text>
                        </Animated.View>
                    ) : (
                        <View style={styles.listContainer}>
                            {transactions.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    {renderTransaction({ item, index })}
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Add Balance Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderInfo}>
                                <Text style={styles.modalTitle}>TOP UP ASSETS</Text>
                                <Text style={styles.modalSubtitle}>Credit Injection</Text>
                            </View>
                            <Pressable onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                                <X size={20} color="#64748B" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputCard}>
                                <Text style={styles.inputLabel}>AMOUNT (INR)</Text>
                                <Input
                                    value={addAmount}
                                    onChangeText={setAddAmount}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    containerStyle={styles.inputInner}
                                    style={styles.textInputLarge}
                                />
                            </View>

                            <View style={styles.quickAmounts}>
                                {[500, 1000, 2000, 5000].map(amt => (
                                    <Pressable
                                        key={amt}
                                        onPress={() => {
                                            setAddAmount(amt.toString());
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        style={styles.quickAmtBtn}
                                    >
                                        <Text style={styles.quickAmtText}>+{amt}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Pressable
                                onPress={handleAddBalance}
                                disabled={isSaving}
                                style={({ pressed }) => [
                                    styles.saveBtn,
                                    pressed && { transform: [{ scale: 0.98 }] },
                                    isSaving && { opacity: 0.7 }
                                ]}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, '#FF7A00']}
                                    style={styles.saveGradient}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <>
                                            <Check size={20} color="#FFF" strokeWidth={3} />
                                            <Text style={styles.saveBtnText}>INJECT CREDIT</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Sticky Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20 },

    // Balance Card
    balanceCard: { width: '100%', height: 210, borderRadius: 36, padding: 25, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 15, justifyContent: 'space-between', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1 },
    balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    balanceValue: { color: '#FFF', fontSize: 42, fontWeight: '900', marginTop: 5, letterSpacing: -1 },
    cardChipBox: { alignItems: 'center', gap: 8 },
    chipGraphic: { width: 40, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    verifiedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    verifiedText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    cardActionText: { color: Colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    // History Section
    historySection: { marginTop: 35 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginLeft: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    loaderBox: { height: 200, justifyContent: 'center', alignItems: 'center' },
    listContainer: { gap: 12 },
    transactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1.5, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    transactionInfo: { flex: 1, marginLeft: 15 },
    transactionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
    transactionDate: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
    amountBox: { alignItems: 'flex-end', gap: 4 },
    transactionAmount: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },

    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 14, fontWeight: '900', color: '#64748B', letterSpacing: 1.5 },
    emptySubText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 8, textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 40, paddingHorizontal: 25 },
    modalDragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 15, marginBottom: 10 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    modalHeaderInfo: { flex: 1 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    modalSubtitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    closeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    formContainer: { gap: 20 },
    inputCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#F1F5F9' },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
    inputInner: { borderWidth: 0, paddingHorizontal: 4, marginBottom: 0, height: 60, backgroundColor: 'transparent' },
    textInputLarge: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
    quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickAmtBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    quickAmtText: { fontSize: 13, fontWeight: '900', color: '#475569' },
    saveBtn: { borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, marginTop: 10 },
    saveGradient: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
