import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { bookingApi, customerApi, catalogApi, paymentApi } from '../../lib/marketplace';

// ─── Types ───

interface StepProps {
    activeStep: number;
    totalSteps: number;
    labels: string[];
}

function StepIndicator({ activeStep, totalSteps, labels }: StepProps) {
    return (
        <View style={stepStyles.container}>
            {labels.map((label, i) => (
                <View key={i} style={stepStyles.step}>
                    <View
                        style={[
                            stepStyles.dot,
                            i < activeStep && stepStyles.dotDone,
                            i === activeStep && stepStyles.dotActive,
                        ]}
                    >
                        {i < activeStep ? (
                            <Ionicons name="checkmark" size={14} color="white" />
                        ) : (
                            <Text
                                style={[
                                    stepStyles.dotText,
                                    i === activeStep && stepStyles.dotTextActive,
                                ]}
                            >
                                {i + 1}
                            </Text>
                        )}
                    </View>
                    <Text
                        style={[
                            stepStyles.label,
                            i <= activeStep && stepStyles.labelActive,
                        ]}
                    >
                        {label}
                    </Text>
                    {i < totalSteps - 1 && (
                        <View style={[stepStyles.line, i < activeStep && stepStyles.lineDone]} />
                    )}
                </View>
            ))}
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.md },
    step: { alignItems: 'center', flex: 1 },
    dot: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: Colors.border,
    },
    dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
    dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    dotText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
    dotTextActive: { color: Colors.primary },
    label: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
    labelActive: { color: Colors.text },
    line: {
        position: 'absolute', top: 14, left: '60%', right: '-40%', height: 2,
        backgroundColor: Colors.border, zIndex: -1,
    },
    lineDone: { backgroundColor: Colors.success },
});

// ─── Main Screen ───

export default function CheckoutScreen() {
    const router = useRouter();
    const { serviceId, serviceName, price, qty } = useLocalSearchParams<{
        serviceId: string; serviceName: string; price: string; qty: string;
    }>();

    const quantity = Number(qty) || 1;
    const unitPrice = Number(price) || 0;

    // State
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
    const [notes, setNotes] = useState('');

    // Step 1: Address
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    // Step 2: Schedule
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');

    // Step 3: Promo
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoMessage, setPromoMessage] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoApplied, setPromoApplied] = useState(false);

    // Step 4: Payment
    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'RAZORPAY' | 'UPI' | 'CARD'>('WALLET');
    const [walletBalance, setWalletBalance] = useState(0);

    // Price calculations
    const subtotal = unitPrice * quantity;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax - promoDiscount) * 100) / 100;

    const STEP_LABELS = ['Address', 'Schedule', 'Review & Pay'];

    // Fetch addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { data } = await bookingApi.listAddresses();
                setAddresses(data.addresses);
                const def = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
                if (def) setSelectedAddressId(def.id);
            } catch (err) {
                console.error('Failed to fetch addresses:', err);
            } finally {
                setIsFetchingAddresses(false);
            }
        };

        const fetchWallet = async () => {
            try {
                const res = await paymentApi.listMethods();
                setWalletBalance(res?.data?.wallet?.balance || 0);
            } catch (err) {
                console.error('Failed to fetch wallet info:', err);
            }
        };

        fetchAddresses();
        fetchWallet();
    }, []);

    // Date generation
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            key: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
            date: d.getDate().toString(),
            month: d.toLocaleDateString('en-IN', { month: 'short' }),
        };
    });

    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    // Validate before advancing
    const canAdvance = () => {
        if (step === 0 && !selectedAddressId) {
            Alert.alert('Select Address', 'Please select or add a service address.');
            return false;
        }
        if (step === 1 && (!selectedDate || !selectedTime)) {
            Alert.alert('Select Schedule', 'Pick a date and time for your booking.');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!canAdvance()) return;
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else router.back();
    };

    // Promo code
    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        try {
            const { data } = await catalogApi.validatePromo(promoCode.trim(), subtotal);
            setPromoDiscount(data.discount);
            setPromoMessage(data.message);
            setPromoApplied(true);
        } catch (err: any) {
            setPromoMessage(err?.response?.data?.message || 'Invalid promo code');
            setPromoDiscount(0);
            setPromoApplied(false);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoCode('');
        setPromoDiscount(0);
        setPromoMessage('');
        setPromoApplied(false);
    };

    // Place order
    const handleBooking = async () => {
        if (!selectedAddressId || !selectedDate || !selectedTime) return;
        setIsLoading(true);
        try {
            const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

            // 1. Create booking
            const res = await bookingApi.createBooking({
                addressId: selectedAddressId,
                scheduledAt,
                notes: notes || undefined,
                items: [{ serviceId, quantity }],
            });
            const newBooking = res.data.booking;

            // 2. Initiate Payment
            await paymentApi.initiate({
                bookingId: newBooking.id,
                method: paymentMethod,
            });

            // If it's RAZORPAY, would open gateway here.
            // For now, assume success and navigate to confirmation
            router.replace('/(booking)/confirmation');
        } catch (err: any) {
            Alert.alert('Checkout Failed', err.message || 'Something went wrong');
        }
        setIsLoading(false);
    };

    // ─── Render Steps ───

    const renderAddressStep = () => (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.stepTitle}>Where should we come?</Text>
                <Pressable onPress={() => router.push('/(customer)/profile/addresses')}>
                    <Text style={styles.addLink}>+ Add New</Text>
                </Pressable>
            </View>

            {isFetchingAddresses ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
            ) : addresses.length === 0 ? (
                <Pressable
                    style={styles.emptyBox}
                    onPress={() => router.push('/(customer)/profile/addresses')}
                >
                    <Ionicons name="add-circle-outline" size={32} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No addresses saved. Tap to add one.</Text>
                </Pressable>
            ) : (
                <View style={styles.addressList}>
                    {addresses.map((addr) => {
                        const selected = selectedAddressId === addr.id;
                        return (
                            <Pressable
                                key={addr.id}
                                style={[styles.addressCard, selected && styles.addressCardActive]}
                                onPress={() => setSelectedAddressId(addr.id)}
                            >
                                <View style={styles.addrRow}>
                                    <Ionicons
                                        name={addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'location'}
                                        size={20}
                                        color={selected ? 'white' : Colors.primary}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.addrLabel, selected && styles.addrTextW]}>{addr.label}</Text>
                                        <Text style={[styles.addrLine, selected && styles.addrTextW]} numberOfLines={2}>
                                            {addr.line1}, {addr.city}
                                        </Text>
                                    </View>
                                    {selected && <Ionicons name="checkmark-circle" size={22} color="white" />}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );

    const renderScheduleStep = () => (
        <View>
            <Text style={styles.stepTitle}>Pick a date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                <View style={styles.dateRow}>
                    {dates.map((d) => {
                        const sel = selectedDate === d.key;
                        return (
                            <Pressable
                                key={d.key}
                                style={[styles.dateCard, sel && styles.dateCardActive]}
                                onPress={() => setSelectedDate(d.key)}
                            >
                                <Text style={[styles.dateDay, sel && styles.dateTextW]}>{d.day}</Text>
                                <Text style={[styles.dateNum, sel && styles.dateTextW]}>{d.date}</Text>
                                <Text style={[styles.dateMonth, sel && styles.dateTextW]}>{d.month}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            <Text style={[styles.stepTitle, { marginTop: Spacing.xl }]}>Pick a time</Text>
            <View style={styles.timeGrid}>
                {times.map((t) => {
                    const sel = selectedTime === t;
                    return (
                        <Pressable
                            key={t}
                            style={[styles.timeChip, sel && styles.timeChipActive]}
                            onPress={() => setSelectedTime(t)}
                        >
                            <Text style={[styles.timeText, sel && styles.timeTextActive]}>{t}</Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={{ marginTop: Spacing.xl }}>
                <Text style={styles.sectionLabel}>Special Instructions (optional)</Text>
                <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="E.g. Ring the doorbell, pet in house..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                />
            </View>
        </View>
    );

    const renderReviewStep = () => (
        <View>
            <Text style={styles.stepTitle}>Order Summary</Text>

            {/* Service */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{serviceName}</Text>
                <Text style={styles.summaryDetail}>Qty: {quantity} × ₹{unitPrice}</Text>
            </View>

            {/* Promo Code */}
            <View style={styles.promoSection}>
                <Text style={styles.sectionLabel}>Promo Code</Text>
                {promoApplied ? (
                    <View style={styles.promoApplied}>
                        <View style={styles.promoAppliedLeft}>
                            <Ionicons name="pricetag" size={18} color={Colors.success} />
                            <Text style={styles.promoAppliedText}>{promoCode.toUpperCase()}</Text>
                        </View>
                        <Pressable onPress={handleRemovePromo}>
                            <Ionicons name="close-circle" size={22} color={Colors.error} />
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.promoInputRow}>
                        <TextInput
                            style={styles.promoInput}
                            value={promoCode}
                            onChangeText={setPromoCode}
                            placeholder="Enter code"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="characters"
                        />
                        <Pressable
                            style={styles.promoBtn}
                            onPress={handleApplyPromo}
                            disabled={promoLoading}
                        >
                            {promoLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.promoBtnText}>Apply</Text>
                            )}
                        </Pressable>
                    </View>
                )}
                {promoMessage ? (
                    <Text style={[styles.promoMsg, promoApplied ? styles.promoMsgSuccess : styles.promoMsgError]}>
                        {promoMessage}
                    </Text>
                ) : null}
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>₹{subtotal.toFixed(0)}</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>GST (18%)</Text>
                    <Text style={styles.priceValue}>₹{tax.toFixed(0)}</Text>
                </View>
                {promoDiscount > 0 && (
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: Colors.success }]}>Promo Discount</Text>
                        <Text style={[styles.priceValue, { color: Colors.success }]}>-₹{promoDiscount.toFixed(0)}</Text>
                    </View>
                )}
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
                </View>
            </View>

            {/* Payment Method */}
            <View style={styles.paymentSection}>
                <Text style={styles.sectionLabel}>Payment Method</Text>

                <Pressable
                    style={[styles.paymentCard, paymentMethod === 'WALLET' && styles.paymentCardActive]}
                    onPress={() => setPaymentMethod('WALLET')}
                >
                    <Ionicons name="wallet-outline" size={24} color={paymentMethod === 'WALLET' ? Colors.primary : Colors.textMuted} />
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentTitle, paymentMethod === 'WALLET' && styles.paymentTitleActive]}>Wallet</Text>
                        <Text style={styles.paymentSubtitle}>Balance: ₹{walletBalance.toFixed(0)}</Text>
                    </View>
                    <Ionicons
                        name={paymentMethod === 'WALLET' ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={paymentMethod === 'WALLET' ? Colors.primary : Colors.border}
                    />
                </Pressable>

                <Pressable
                    style={[styles.paymentCard, paymentMethod === 'RAZORPAY' && styles.paymentCardActive]}
                    onPress={() => setPaymentMethod('RAZORPAY')}
                >
                    <Ionicons name="card-outline" size={24} color={paymentMethod === 'RAZORPAY' ? Colors.primary : Colors.textMuted} />
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentTitle, paymentMethod === 'RAZORPAY' && styles.paymentTitleActive]}>Pay Online</Text>
                        <Text style={styles.paymentSubtitle}>Credit/Debit Card, UPI, etc.</Text>
                    </View>
                    <Ionicons
                        name={paymentMethod === 'RAZORPAY' ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={paymentMethod === 'RAZORPAY' ? Colors.primary : Colors.border}
                    />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </Pressable>
                    <Text style={styles.title}>Checkout</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Step Indicator */}
                <StepIndicator activeStep={step} totalSteps={3} labels={STEP_LABELS} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 0 && renderAddressStep()}
                    {step === 1 && renderScheduleStep()}
                    {step === 2 && renderReviewStep()}
                </ScrollView>

                {/* Bottom CTA */}
                <View style={styles.bottomBar}>
                    {step < 2 ? (
                        <Button
                            title="Continue"
                            onPress={handleNext}
                        />
                    ) : (
                        <Button
                            title={`Confirm Booking · ₹${total.toFixed(0)}`}
                            onPress={handleBooking}
                            loading={isLoading}
                            disabled={isLoading}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 120 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: BorderRadius.md,
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    // ─── Steps ───
    stepTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addLink: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
    sectionLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
    // ─── Address ───
    addressList: { gap: Spacing.sm, marginTop: Spacing.md },
    addressCard: {
        borderRadius: BorderRadius.lg, padding: Spacing.md,
        backgroundColor: Colors.backgroundAlt, borderWidth: 2, borderColor: 'transparent',
    },
    addressCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    addrRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    addrLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    addrLine: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    addrTextW: { color: 'white' },
    emptyBox: {
        padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1,
        borderStyle: 'dashed', borderColor: Colors.border, alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md,
    },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
    // ─── Schedule ───
    dateRow: { flexDirection: 'row', gap: Spacing.sm },
    dateCard: {
        width: 68, alignItems: 'center', paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundAlt, gap: 2,
    },
    dateCardActive: { backgroundColor: Colors.primary },
    dateDay: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
    dateNum: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    dateMonth: { fontSize: FontSize.xs, color: Colors.textMuted },
    dateTextW: { color: '#fff' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
    timeChip: {
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundAlt,
    },
    timeChipActive: { backgroundColor: Colors.primary },
    timeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    timeTextActive: { color: '#fff' },
    notesInput: {
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        padding: Spacing.md, fontSize: FontSize.md, color: Colors.text,
        textAlignVertical: 'top', minHeight: 80,
    },
    // ─── Review / Price ───
    summaryCard: {
        backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.lg,
    },
    summaryLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    summaryDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
    // ─── Promo ───
    promoSection: { marginBottom: Spacing.lg },
    promoInputRow: { flexDirection: 'row', gap: Spacing.sm },
    promoInput: {
        flex: 1, backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        fontSize: FontSize.md, color: Colors.text,
    },
    promoBtn: {
        backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg, justifyContent: 'center', alignItems: 'center',
    },
    promoBtnText: { color: 'white', fontWeight: '700', fontSize: FontSize.sm },
    promoApplied: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.success + '15', borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    promoAppliedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    promoAppliedText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.success },
    promoMsg: { fontSize: FontSize.xs, marginTop: Spacing.xs },
    promoMsgSuccess: { color: Colors.success },
    promoMsgError: { color: Colors.error },
    // ─── Price Card ───
    priceCard: {
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.xl,
        padding: Spacing.lg, gap: Spacing.sm,
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    priceValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    priceDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
    totalLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    totalValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
    // ─── Payment Methods ───
    paymentSection: { marginTop: Spacing.xl },
    paymentCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundAlt,
        padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
        borderWidth: 2, borderColor: 'transparent',
    },
    paymentCardActive: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '05' },
    paymentInfo: { flex: 1, marginLeft: Spacing.md },
    paymentTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textDark },
    paymentTitleActive: { color: Colors.primary },
    paymentSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    // ─── Bottom ───
    bottomBar: {
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
        paddingBottom: Spacing.xl + 10,
        backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border,
    },
});
