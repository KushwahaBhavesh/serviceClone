import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    ChevronRight,
    Plus,
    CheckCircle2,
    Tag,
    Wallet,
    CreditCard,
    Smartphone,
    ShieldCheck,
    X,
    Check,
    Info
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { bookingApi, catalogApi, paymentApi } from '../../lib/marketplace';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

// ─── Step Indicator ───

function StepIndicator({ activeStep, totalSteps, labels }: { activeStep: number; totalSteps: number; labels: string[] }) {
    return (
        <View style={stepStyles.container}>
            {labels.map((label, i) => (
                <View key={i} style={stepStyles.stepWrap}>
                    <View style={stepStyles.stepContent}>
                        <View style={[
                            stepStyles.orb,
                            i < activeStep && stepStyles.orbDone,
                            i === activeStep && stepStyles.orbActive
                        ]}>
                            {i < activeStep ? (
                                <Check size={14} color="#FFF" strokeWidth={3} />
                            ) : (
                                <Text style={[stepStyles.orbText, i === activeStep && stepStyles.orbTextActive]}>{i + 1}</Text>
                            )}
                        </View>
                        <Text style={[stepStyles.label, i <= activeStep && stepStyles.labelActive]}>{label.toUpperCase()}</Text>
                    </View>
                    {i < totalSteps - 1 && (
                        <View style={stepStyles.connector}>
                            <View style={[stepStyles.connectorFill, i < activeStep && stepStyles.connectorFillDone]} />
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 20, justifyContent: 'space-between' },
    stepWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    stepContent: { alignItems: 'center', gap: 8, zIndex: 2 },
    orb: { width: 32, height: 32, borderRadius: 14, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F0F0F0' },
    orbActive: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
    orbDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    orbText: { fontSize: 13, fontWeight: '800', color: '#AAA', letterSpacing: -0.5 },
    orbTextActive: { color: Colors.primary },
    label: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    labelActive: { color: '#111' },
    connector: { flex: 1, height: 2, backgroundColor: '#F0F0F0', marginHorizontal: 12, marginTop: -20 },
    connectorFill: { height: '100%', width: '0%', backgroundColor: Colors.primary },
    connectorFillDone: { width: '100%' },
});

// ─── Main Screen ───

export default function CheckoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError } = useToast();
    const { serviceId, serviceName, price, qty } = useLocalSearchParams<{ serviceId: string; serviceName: string; price: string; qty: string; }>();

    const quantity = Number(qty) || 1;
    const unitPrice = Number(price) || 0;

    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
    const [notes, setNotes] = useState('');

    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');

    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoLoading, setPromoLoading] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'RAZORPAY' | 'UPI' | 'CARD'>('WALLET');
    const [walletBalance, setWalletBalance] = useState(0);

    const subtotal = unitPrice * quantity;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax - promoDiscount) * 100) / 100;

    const STEP_LABELS = ['Address', 'Schedule', 'Payment'];

    useEffect(() => {
        (async () => {
            try {
                const { data } = await bookingApi.listAddresses();
                setAddresses(data.addresses);
                const def = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
                if (def) setSelectedAddressId(def.id);

                const res = await paymentApi.listMethods();
                setWalletBalance(res?.data?.wallet?.balance || 0);
            } catch { /* silent */ }
            finally { setIsFetchingAddresses(false); }
        })();
    }, []);

    const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            key: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
            date: d.getDate().toString(),
            month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
        };
    }), []);

    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    const handleNext = () => {
        if (step === 0 && !selectedAddressId) { showError('Select valid address.'); return; }
        if (step === 1 && (!selectedDate || !selectedTime)) { showError('Select date and time.'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStep(step + 1);
    };

    const handleBooking = async () => {
        if (!serviceId) { showError('Service identification failed.'); return; }
        setIsLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
            const bookingRes = await bookingApi.createBooking({ addressId: selectedAddressId!, scheduledAt, notes, items: [{ serviceId, quantity }] });
            const bookingId = bookingRes.data.booking.id;

            const payRes = await paymentApi.initiate({ bookingId, method: paymentMethod });

            // WALLET: already completed on server
            if (payRes.data.status === 'COMPLETED') {
                router.replace('/(booking)/confirmation');
                return;
            }

            // RAZORPAY / UPI / CARD: launch SDK
            if (payRes.data.gatewayConfig) {
                const config = payRes.data.gatewayConfig;
                try {
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

                    // Verify payment on server
                    await paymentApi.confirm({
                        transactionId: payRes.data.transactionId,
                        razorpay_payment_id: sdkResult.razorpay_payment_id,
                        razorpay_order_id: sdkResult.razorpay_order_id,
                        razorpay_signature: sdkResult.razorpay_signature,
                    });

                    router.replace('/(booking)/confirmation');
                } catch (sdkErr: any) {
                    // SDK was dismissed or payment failed
                    router.replace({
                        pathname: '/(booking)/payment-failed' as any,
                        params: {
                            bookingId,
                            errorCode: sdkErr?.code || 'PAYMENT_FAILED',
                            errorDescription: sdkErr?.description || sdkErr?.message || 'Payment could not be processed.',
                        },
                    });
                }
            }
        } catch (err: any) { showError(err.message || 'Booking failed.'); }
        finally { setIsLoading(false); }
    };

    const renderAddressStep = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT ADDRESS</Text>
                <Pressable onPress={() => router.push('/(customer)/profile/addresses')} style={styles.addBtn}>
                    <Plus size={16} color={Colors.primary} strokeWidth={3} />
                    <Text style={styles.addBtnText}>ADD NEW</Text>
                </Pressable>
            </View>

            {isFetchingAddresses ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <View style={styles.addressList}>
                    {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                            <Pressable
                                key={addr.id}
                                style={[styles.addressCard, isSelected && styles.addressCardActive]}
                                onPress={() => { setSelectedAddressId(addr.id); Haptics.selectionAsync(); }}
                            >
                                <View style={[styles.addrIconBox, isSelected && { backgroundColor: '#FFF' }]}>
                                    <MapPin size={18} color={isSelected ? Colors.primary : "#AAA"} strokeWidth={2.5} />
                                </View>
                                <View style={styles.addrInfo}>
                                    <View style={styles.addrHeaderRow}>
                                        <Text style={[styles.addrLabel, isSelected && { color: '#FFF' }]}>{addr.label.toUpperCase()}</Text>
                                        {addr.isDefault && <View style={[styles.defaultBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Text style={[styles.defaultText, isSelected && { color: '#FFF' }]}>DEFAULT</Text></View>}
                                    </View>
                                    <Text style={[styles.addrLine, isSelected && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{addr.line1}</Text>
                                </View>
                                {isSelected && <CheckCircle2 size={24} color="#FFF" strokeWidth={2.5} />}
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </Animated.View>
    );

    const renderScheduleStep = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>SELECT DATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroller}>
                {dates.map((d) => {
                    const isSelected = selectedDate === d.key;
                    return (
                        <Pressable
                            key={d.key}
                            style={[styles.dateCard, isSelected && styles.dateCardActive]}
                            onPress={() => { setSelectedDate(d.key); Haptics.selectionAsync(); }}
                        >
                            <Text style={[styles.dateDay, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>{d.day}</Text>
                            <Text style={[styles.dateNum, isSelected && { color: '#FFF' }]}>{d.date}</Text>
                            <Text style={[styles.dateMonth, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>{d.month}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 35 }]}>SELECT TIME</Text>
            <View style={styles.timeGrid}>
                {times.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                        <Pressable
                            key={t}
                            style={[styles.timeChip, isSelected && styles.timeChipActive]}
                            onPress={() => { setSelectedTime(t); Haptics.selectionAsync(); }}
                        >
                            <Text style={[styles.timeText, isSelected && { color: '#FFF' }]}>{t}</Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>ADDITIONAL NOTES</Text>
                <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="E.g. Call before arrival, Gate code, etc."
                    placeholderTextColor="#AAA"
                    multiline
                />
            </View>
        </Animated.View>
    );

    const renderPaymentStep = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>PROMO CODE</Text>
            <View style={styles.promoCard}>
                <Tag size={18} color="#AAA" />
                <TextInput
                    style={styles.promoInput}
                    placeholder="ENTER CODE"
                    placeholderTextColor="#AAA"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                />
                <Pressable style={styles.applyBtn}>
                    <Text style={styles.applyBtnText}>APPLY</Text>
                </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 35 }]}>PAYMENT METHOD</Text>
            <View style={styles.paymentList}>
                <Pressable
                    style={[styles.payCard, paymentMethod === 'WALLET' && styles.payCardActive]}
                    onPress={() => { setPaymentMethod('WALLET'); Haptics.selectionAsync(); }}
                >
                    <View style={styles.payIcon}><Wallet size={20} color={paymentMethod === 'WALLET' ? Colors.primary : "#AAA"} /></View>
                    <View style={styles.payInfo}>
                        <Text style={[styles.payTitle, paymentMethod === 'WALLET' && { color: Colors.primary }]}>WALLET</Text>
                        <Text style={styles.paySub}>BALANCE: ₹{walletBalance.toFixed(0)}</Text>
                    </View>
                    <View style={[styles.radio, paymentMethod === 'WALLET' && styles.radioActive]}>
                        {paymentMethod === 'WALLET' && <View style={styles.radioInner} />}
                    </View>
                </Pressable>

                <Pressable
                    style={[styles.payCard, paymentMethod === 'RAZORPAY' && styles.payCardActive]}
                    onPress={() => { setPaymentMethod('RAZORPAY'); Haptics.selectionAsync(); }}
                >
                    <View style={styles.payIcon}><CreditCard size={20} color={paymentMethod === 'RAZORPAY' ? Colors.primary : "#AAA"} /></View>
                    <View style={styles.payInfo}>
                        <Text style={[styles.payTitle, paymentMethod === 'RAZORPAY' && { color: Colors.primary }]}>ONLINE SECURE</Text>
                        <Text style={styles.paySub}>CARDS, UPI, NETBANKING</Text>
                    </View>
                    <View style={[styles.radio, paymentMethod === 'RAZORPAY' && styles.radioActive]}>
                        {paymentMethod === 'RAZORPAY' && <View style={styles.radioInner} />}
                    </View>
                </Pressable>
            </View>

            <View style={styles.priceBento}>
                <View style={styles.priceRow}><Text style={styles.priceLabel}>SUBTOTAL</Text><Text style={styles.priceVal}>₹{subtotal.toFixed(0)}</Text></View>
                <View style={styles.priceRow}><Text style={styles.priceLabel}>TAXES (18%)</Text><Text style={styles.priceVal}>₹{tax.toFixed(0)}</Text></View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}><Text style={styles.totalLabel}>TOTAL PAYABLE</Text><Text style={styles.totalVal}>₹{total.toFixed(0)}</Text></View>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable style={styles.backBtn} onPress={() => { if (step > 0) setStep(step - 1); else router.back(); }}>
                    <ArrowLeft size={20} color="#111" strokeWidth={3} />
                </Pressable>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>SECURE CHECKOUT</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>{(serviceName || 'SERVICE').toUpperCase()}</Text>
                </View>
                <View style={styles.shieldBadge}><ShieldCheck size={18} color={Colors.primary} strokeWidth={2.5} /></View>
            </View>

            <StepIndicator activeStep={step} totalSteps={3} labels={STEP_LABELS} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {step === 0 && renderAddressStep()}
                {step === 1 && renderScheduleStep()}
                {step === 2 && renderPaymentStep()}
            </ScrollView>

            {/* Sticky Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 15 }]}>
                <View style={styles.bottomContent}>
                    <View style={styles.bottomPriceInfo}>
                        <Text style={styles.bottomPriceLabel}>TOTAL ESTIMATE</Text>
                        <Text style={styles.bottomPriceVal}>₹{total.toFixed(0)}</Text>
                    </View>
                    <Pressable
                        style={styles.mainCta}
                        onPress={step < 2 ? handleNext : handleBooking}
                        disabled={isLoading}
                    >
                        <View style={styles.ctaInner}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.ctaText}>{step < 2 ? 'CONTINUE' : 'CONFIRM BOOKING'}</Text>
                                    <ChevronRight size={18} color="#FFF" strokeWidth={3.5} />
                                </>
                            )}
                        </View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, height: 80, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    headerTitleWrap: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 10, fontWeight: '800', color: '#AAA', marginTop: 2, letterSpacing: 0.2 },
    shieldBadge: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    scroll: { flexGrow: 1, paddingBottom: 120 },
    stepContainer: { paddingHorizontal: 25, paddingTop: 10 },

    // Section Commons
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1.5 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    addBtnText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },

    // Address
    addressList: { gap: 12 },
    addressCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20, borderRadius: 28, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0' },
    addressCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    addrIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    addrInfo: { flex: 1 },
    addrHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addrLabel: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.2 },
    defaultBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    defaultText: { fontSize: 7, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    addrLine: { fontSize: 12, fontWeight: '600', color: '#AAA', marginTop: 4 },

    // Schedule
    dateScroller: { paddingRight: 25, marginTop: 15 },
    dateCard: { width: 75, height: 95, borderRadius: 24, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12, gap: 5 },
    dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dateDay: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    dateNum: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -1 },
    dateMonth: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },

    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
    timeChip: { width: (width - 70) / 3, height: 48, borderRadius: 16, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    timeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    timeText: { fontSize: 13, fontWeight: '800', color: '#AAA' },

    notesBox: { marginTop: 35 },
    notesLabel: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1.5, marginBottom: 15 },
    notesInput: { backgroundColor: '#FAFAFA', borderRadius: 24, padding: 20, height: 110, textAlignVertical: 'top', fontSize: 14, fontWeight: '600', color: '#111', borderWidth: 1, borderColor: '#F0F0F0' },

    // Payment
    promoCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#FAFAFA', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#F0F0F0' },
    promoInput: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 1 },
    applyBtn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
    applyBtnText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

    paymentList: { gap: 12, marginTop: 20 },
    payCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20, borderRadius: 28, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0' },
    payCardActive: { borderColor: Colors.primary + '30', backgroundColor: Colors.primary + '05' },
    payIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10 },
    payInfo: { flex: 1 },
    payTitle: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
    paySub: { fontSize: 10, fontWeight: '800', color: '#AAA', marginTop: 4 },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    radioActive: { borderColor: Colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },

    priceBento: { marginTop: 35, backgroundColor: '#FFF', borderRadius: 32, padding: 25, gap: 15, borderWidth: 1, borderColor: '#F0F0F0' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    priceVal: { fontSize: 15, fontWeight: '800', color: '#111' },
    priceDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 5 },
    totalLabel: { fontSize: 13, fontWeight: '800', color: '#111', letterSpacing: 1 },
    totalVal: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -1.5 },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    bottomContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
    bottomPriceInfo: { flex: 1 },
    bottomPriceLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    bottomPriceVal: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
    mainCta: { flex: 2, height: 60, borderRadius: 20, backgroundColor: Colors.primary, overflow: 'hidden' },
    ctaInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    ctaText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
});
