import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../lib/api';
import { Promotion } from '../../lib/merchant';

const MERCHANT = '/api/v1/merchant';

type PromoType = 'PERCENTAGE' | 'FLAT';

function isExpired(isoDate: string): boolean {
    return new Date(isoDate) < new Date();
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

interface CreatePromoForm {
    code: string;
    type: PromoType;
    value: string;
    minOrderValue: string;
    maxDiscount: string;
    expiryDays: string;
    usageLimit: string;
}

const DEFAULT_FORM: CreatePromoForm = {
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    expiryDays: '30',
    usageLimit: '',
};

// ─── Promo Card ───────────────────────────────────────────────────────────────

interface PromoCardProps {
    item: Promotion;
    onToggle: (promo: Promotion) => void;
}

function PromoCard({ item, onToggle }: PromoCardProps) {
    const expired = isExpired(item.expiryDate);
    const isDisabled = expired && item.isActive;

    return (
        <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={styles.cardHeader}>
                <View style={styles.codeRow}>
                    <Ionicons name="pricetag" size={18} color={Colors.primary} />
                    <Text style={styles.codeText}>{item.code}</Text>
                    {!item.isActive && (
                        <View style={[styles.badge, { backgroundColor: Colors.border }]}>
                            <Text style={[styles.badgeText, { color: Colors.textSecondary }]}>Inactive</Text>
                        </View>
                    )}
                    {expired && item.isActive && (
                        <View style={[styles.badge, { backgroundColor: Colors.error + '20' }]}>
                            <Text style={[styles.badgeText, { color: Colors.error }]}>Expired</Text>
                        </View>
                    )}
                </View>
                <Switch
                    value={item.isActive}
                    onValueChange={() => onToggle(item)}
                    trackColor={{ true: Colors.primary, false: Colors.border }}
                    disabled={isDisabled}
                />
            </View>

            <View style={styles.detailsBox}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Discount</Text>
                    <Text style={styles.detailValue}>
                        {item.type === 'PERCENTAGE' ? `${item.value}% OFF` : `₹${item.value} FLAT`}
                    </Text>
                </View>
                {item.minOrderValue != null && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Min Order</Text>
                        <Text style={styles.detailValue}>₹{item.minOrderValue}</Text>
                    </View>
                )}
                {item.maxDiscount != null && item.type === 'PERCENTAGE' && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Max Cap</Text>
                        <Text style={styles.detailValue}>₹{item.maxDiscount}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.footerText}>Expires: {formatDate(item.expiryDate)}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="stats-chart-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.footerText}>
                        Used: {item.currentUsage}{item.usageLimit != null ? ` / ${item.usageLimit}` : ''}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Create Promo Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: (promo: Promotion) => void;
}

function CreatePromoModal({ visible, onClose, onCreated }: CreateModalProps) {
    const [form, setForm] = useState<CreatePromoForm>(DEFAULT_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const field = (key: keyof CreatePromoForm) => ({
        value: form[key] as string,
        onChangeText: (v: string) => setForm(prev => ({ ...prev, [key]: v })),
    });

    const handleSubmit = async () => {
        const errors: string[] = [];

        if (!form.code.trim()) errors.push('Promotion code is required.');
        if (!form.value.trim() || isNaN(parseFloat(form.value)) || parseFloat(form.value) <= 0)
            errors.push('Discount value must be a positive number.');
        if (form.type === 'PERCENTAGE' && parseFloat(form.value) > 100)
            errors.push('Percentage discount cannot exceed 100%.');
        const days = parseInt(form.expiryDays, 10);
        if (isNaN(days) || days < 1) errors.push('Expiry days must be at least 1.');
        if (form.minOrderValue && (isNaN(parseFloat(form.minOrderValue)) || parseFloat(form.minOrderValue) < 0))
            errors.push('Min order value must be 0 or greater.');
        if (form.maxDiscount && (isNaN(parseFloat(form.maxDiscount)) || parseFloat(form.maxDiscount) <= 0))
            errors.push('Max discount cap must be a positive number.');
        if (form.usageLimit && (isNaN(parseInt(form.usageLimit, 10)) || parseInt(form.usageLimit, 10) < 1))
            errors.push('Usage limit must be a positive integer.');

        if (errors.length > 0) {
            Alert.alert('Validation Error', errors.join('\n'));
            return;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        const payload: Record<string, unknown> = {
            code: form.code.trim().toUpperCase(),
            type: form.type,
            value: parseFloat(form.value),
            expiryDate: expiryDate.toISOString(),
        };
        if (form.minOrderValue) payload.minOrderValue = parseFloat(form.minOrderValue);
        if (form.maxDiscount) payload.maxDiscount = parseFloat(form.maxDiscount);
        if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit, 10);

        setIsSubmitting(true);
        try {
            const res = await api.post<{ promotion: Promotion }>(MERCHANT + '/promotions', payload);
            onCreated(res.data.promotion);
            setForm(DEFAULT_FORM);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to create promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Promotion</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                    <Text style={styles.label}>Promo Code *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., FESTIVAL20"
                        autoCapitalize="characters"
                        maxLength={20}
                        {...field('code')}
                        onChangeText={v => setForm(p => ({ ...p, code: v.toUpperCase() }))}
                    />

                    <Text style={styles.label}>Discount Type *</Text>
                    <View style={styles.typeRow}>
                        {(['PERCENTAGE', 'FLAT'] as PromoType[]).map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                                onPress={() => setForm(p => ({ ...p, type: t }))}
                            >
                                <Ionicons
                                    name={t === 'PERCENTAGE' ? 'pricetag-outline' : 'cash-outline'}
                                    size={16}
                                    color={form.type === t ? Colors.background : Colors.textSecondary}
                                />
                                <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
                                    {t === 'PERCENTAGE' ? 'Percentage' : 'Flat Amount'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>{form.type === 'PERCENTAGE' ? 'Discount % *' : 'Amount (₹) *'}</Text>
                            <TextInput style={styles.input} placeholder="10" keyboardType="numeric" {...field('value')} />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Expiry (Days) *</Text>
                            <TextInput style={styles.input} placeholder="30" keyboardType="numeric" {...field('expiryDays')} />
                        </View>
                    </View>

                    <Text style={styles.label}>Min Order Value ₹ (Optional)</Text>
                    <TextInput style={styles.input} placeholder="e.g. 500" keyboardType="numeric" {...field('minOrderValue')} />

                    {form.type === 'PERCENTAGE' && (
                        <>
                            <Text style={styles.label}>Max Discount Cap ₹ (Optional)</Text>
                            <TextInput style={styles.input} placeholder="e.g. 200" keyboardType="numeric" {...field('maxDiscount')} />
                        </>
                    )}

                    <Text style={styles.label}>Total Usage Limit (Optional)</Text>
                    <TextInput style={styles.input} placeholder="Unlimited if empty" keyboardType="numeric" {...field('usageLimit')} />
                    <Text style={styles.helper}>Leave empty to allow unlimited uses.</Text>

                    <View style={{ height: Spacing.xxl }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitBtnText}>{isSubmitting ? 'Creating…' : 'Create Promotion'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MerchantPromotionsScreen() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const load = async (refresh = false) => {
        try {
            const res = await api.get<{ promotions: Promotion[] }>(MERCHANT + '/promotions');
            setPromotions(res.data.promotions);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to load promotions');
        } finally {
            setIsLoading(false);
            if (refresh) setIsRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleToggle = async (promo: Promotion) => {
        const next = !promo.isActive;
        setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: next } : p));
        try {
            await api.put(MERCHANT + `/promotions/${promo.id}`, { isActive: next });
        } catch (error: any) {
            // revert
            setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: promo.isActive } : p));
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to update promotion');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Promotions',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerBtn}>
                            <Ionicons name="add" size={26} color={Colors.primary} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={promotions}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <PromoCard item={item} onToggle={handleToggle} />}
                    contentContainerStyle={styles.list}
                    refreshing={isRefreshing}
                    onRefresh={() => { setIsRefreshing(true); load(true); }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="pricetag-outline" size={52} color={Colors.border} />
                            <Text style={styles.emptyTitle}>No Promotions Yet</Text>
                            <Text style={styles.emptyText}>Create your first coupon to attract more customers.</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                                <Text style={styles.emptyBtnText}>Create Promotion</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <CreatePromoModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onCreated={promo => setPromotions(prev => [promo, ...prev])}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    headerBtn: { paddingHorizontal: Spacing.sm },

    // Card
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardInactive: { opacity: 0.65 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    codeText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
    badgeText: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase' },
    detailsBox: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
    detailValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: FontSize.xs, color: Colors.textMuted },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
    emptyBtn: { marginTop: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    emptyBtnText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: FontSize.sm },

    // Modal
    modalContainer: { flex: 1, backgroundColor: Colors.background },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    cancelText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
    modalBody: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: Spacing.sm },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm + 4,
        fontSize: FontSize.md,
        backgroundColor: Colors.backgroundAlt,
        color: Colors.text,
    },
    helper: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
    row: { flexDirection: 'row', gap: Spacing.sm },
    halfField: { flex: 1 },
    typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.backgroundAlt,
    },
    typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    typeBtnTextActive: { color: Colors.textOnPrimary },
    modalFooter: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: Colors.textOnPrimary, fontSize: FontSize.md, fontWeight: '700' },
});
