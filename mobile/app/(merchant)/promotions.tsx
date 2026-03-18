import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, Alert,
    Modal, TextInput, ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, Plus, Tag, Calendar, BarChart3,
    X, Percent, IndianRupee, Check,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import api from '../../lib/api';
import { Promotion } from '../../lib/merchant';

const MERCHANT = '/api/v1/merchant';
type PromoType = 'PERCENTAGE' | 'FLAT';

function isExpired(iso: string): boolean { return new Date(iso) < new Date(); }
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CreatePromoForm {
    code: string; type: PromoType; value: string;
    minOrderValue: string; maxDiscount: string; expiryDays: string; usageLimit: string;
}
const DEFAULT_FORM: CreatePromoForm = {
    code: '', type: 'PERCENTAGE', value: '',
    minOrderValue: '', maxDiscount: '', expiryDays: '30', usageLimit: '',
};

function PromoCard({ item, onToggle }: { item: Promotion; onToggle: (p: Promotion) => void }) {
    const expired = isExpired(item.expiryDate);
    return (
        <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                <View style={styles.cardHeader}>
                    <View style={styles.codeRow}>
                        <View style={styles.tagIconBox}>
                            <Tag size={14} color={Colors.primary} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.codeText}>{item.code}</Text>
                        {!item.isActive && (
                            <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                                <Text style={[styles.badgeText, { color: '#94A3B8' }]}>Inactive</Text>
                            </View>
                        )}
                        {expired && item.isActive && (
                            <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                                <Text style={[styles.badgeText, { color: '#EF4444' }]}>Expired</Text>
                            </View>
                        )}
                    </View>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => onToggle(item)}
                        trackColor={{ true: Colors.primary + '40', false: '#E2E8F0' }}
                        thumbColor={item.isActive ? Colors.primary : '#94A3B8'}
                        disabled={expired && item.isActive}
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
                        <Calendar size={12} color="#94A3B8" strokeWidth={2} />
                        <Text style={styles.footerText}>Expires: {formatDate(item.expiryDate)}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <BarChart3 size={12} color="#94A3B8" strokeWidth={2} />
                        <Text style={styles.footerText}>
                            Used: {item.currentUsage}{item.usageLimit != null ? ` / ${item.usageLimit}` : ''}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

function CreatePromoModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (p: Promotion) => void }) {
    const insets = useSafeAreaInsets();
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
            errors.push('Discount value must be positive.');
        if (form.type === 'PERCENTAGE' && parseFloat(form.value) > 100)
            errors.push('Percentage cannot exceed 100%.');
        const days = parseInt(form.expiryDays, 10);
        if (isNaN(days) || days < 1) errors.push('Expiry days must be at least 1.');
        if (form.minOrderValue && (isNaN(parseFloat(form.minOrderValue)) || parseFloat(form.minOrderValue) < 0))
            errors.push('Min order value must be 0 or greater.');
        if (form.maxDiscount && (isNaN(parseFloat(form.maxDiscount)) || parseFloat(form.maxDiscount) <= 0))
            errors.push('Max discount cap must be positive.');
        if (form.usageLimit && (isNaN(parseInt(form.usageLimit, 10)) || parseInt(form.usageLimit, 10) < 1))
            errors.push('Usage limit must be a positive integer.');

        if (errors.length > 0) { Alert.alert('Validation Error', errors.join('\n')); return; }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        const payload: Record<string, unknown> = {
            code: form.code.trim().toUpperCase(), type: form.type,
            value: parseFloat(form.value), expiryDate: expiryDate.toISOString(),
        };
        if (form.minOrderValue) payload.minOrderValue = parseFloat(form.minOrderValue);
        if (form.maxDiscount) payload.maxDiscount = parseFloat(form.maxDiscount);
        if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit, 10);

        setIsSubmitting(true);
        try {
            const res = await api.post<{ promotion: Promotion }>(MERCHANT + '/promotions', payload);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onCreated(res.data.promotion);
            setForm(DEFAULT_FORM);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to create promotion');
        } finally { setIsSubmitting(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Promotion</Text>
                    <Pressable onPress={onClose} style={styles.modalClose}>
                        <X size={20} color="#64748B" strokeWidth={2} />
                    </Pressable>
                </View>
                <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Promo Code *</Text>
                    <TextInput
                        style={styles.input} placeholder="e.g., FESTIVAL20"
                        autoCapitalize="characters" maxLength={20} placeholderTextColor="#CBD5E1"
                        {...field('code')}
                        onChangeText={v => setForm(p => ({ ...p, code: v.toUpperCase() }))}
                    />

                    <Text style={styles.label}>Discount Type *</Text>
                    <View style={styles.typeRow}>
                        {(['PERCENTAGE', 'FLAT'] as PromoType[]).map(t => {
                            const isActive = form.type === t;
                            return (
                                <Pressable
                                    key={t}
                                    onPress={() => setForm(p => ({ ...p, type: t }))}
                                    style={[styles.typeBtn, isActive && styles.typeBtnActive]}
                                >
                                    {t === 'PERCENTAGE'
                                        ? <Percent size={14} color={isActive ? '#FFF' : '#64748B'} strokeWidth={2.5} />
                                        : <IndianRupee size={14} color={isActive ? '#FFF' : '#64748B'} strokeWidth={2.5} />
                                    }
                                    <Text style={[styles.typeBtnText, isActive && styles.typeBtnTextActive]}>
                                        {t === 'PERCENTAGE' ? 'Percentage' : 'Flat Amount'}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>{form.type === 'PERCENTAGE' ? 'Discount % *' : 'Amount (₹) *'}</Text>
                            <TextInput style={styles.input} placeholder="10" keyboardType="numeric" placeholderTextColor="#CBD5E1" {...field('value')} />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Expiry (Days) *</Text>
                            <TextInput style={styles.input} placeholder="30" keyboardType="numeric" placeholderTextColor="#CBD5E1" {...field('expiryDays')} />
                        </View>
                    </View>

                    <Text style={styles.label}>Min Order Value ₹ (Optional)</Text>
                    <TextInput style={styles.input} placeholder="e.g., 500" keyboardType="numeric" placeholderTextColor="#CBD5E1" {...field('minOrderValue')} />

                    {form.type === 'PERCENTAGE' && (
                        <>
                            <Text style={styles.label}>Max Discount Cap ₹ (Optional)</Text>
                            <TextInput style={styles.input} placeholder="e.g., 200" keyboardType="numeric" placeholderTextColor="#CBD5E1" {...field('maxDiscount')} />
                        </>
                    )}

                    <Text style={styles.label}>Total Usage Limit (Optional)</Text>
                    <TextInput style={styles.input} placeholder="Unlimited if empty" keyboardType="numeric" placeholderTextColor="#CBD5E1" {...field('usageLimit')} />
                    <Text style={styles.helper}>Leave empty to allow unlimited uses.</Text>

                    <View style={{ height: 30 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                    <Pressable
                        onPress={handleSubmit} disabled={isSubmitting}
                        style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }, isSubmitting && { opacity: 0.5 }]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> :
                                <Text style={styles.submitText}>Create Promotion</Text>
                            }
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

export default function MerchantPromotionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
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
        } finally { setIsLoading(false); if (refresh) setIsRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    const handleToggle = async (promo: Promotion) => {
        const next = !promo.isActive;
        setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: next } : p));
        try {
            await api.put(MERCHANT + `/promotions/${promo.id}`, { isActive: next });
        } catch (error: any) {
            setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: promo.isActive } : p));
            Alert.alert('Error', error.response?.data?.error ?? 'Failed to update promotion');
        }
    };

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
                <Text style={styles.headerTitle}>Promotions</Text>
                <Pressable
                    onPress={() => { setShowModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.addGradient}
                    >
                        <Plus size={18} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
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
                            <View style={styles.emptyIconBox}>
                                <Tag size={32} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No Promotions Yet</Text>
                            <Text style={styles.emptyHint}>Create your first coupon to attract more customers.</Text>
                            <Pressable
                                onPress={() => setShowModal(true)}
                                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.8 }]}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.emptyCtaGradient}
                                >
                                    <Text style={styles.emptyCtaText}>Create Promotion</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    }
                />
            )}

            <CreatePromoModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onCreated={promo => setPromotions(prev => [promo, ...prev])}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 12,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A' },
    addBtn: { borderRadius: 14, overflow: 'hidden' },
    addGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    list: { padding: Spacing.lg, gap: 12, paddingBottom: 40 },

    // Card
    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    cardInactive: { opacity: 0.6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    tagIconBox: {
        width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary + '12',
        justifyContent: 'center', alignItems: 'center',
    },
    codeText: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    detailsBox: {
        flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14,
        padding: 14, marginBottom: 14, gap: 8,
    },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    detailValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12,
    },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl, gap: 8 },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    emptyHint: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
    emptyCta: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
    emptyCtaGradient: { paddingHorizontal: 24, paddingVertical: 12 },
    emptyCtaText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    modalClose: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    modalBody: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: '#0F172A', fontWeight: '600',
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    helper: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
    row: { flexDirection: 'row', gap: 10 },
    halfField: { flex: 1 },
    typeRow: { flexDirection: 'row', gap: 8 },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 14,
        borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF',
    },
    typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    typeBtnTextActive: { color: '#FFF' },
    modalFooter: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFF' },
    submitBtn: { borderRadius: 16, overflow: 'hidden' },
    submitGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
