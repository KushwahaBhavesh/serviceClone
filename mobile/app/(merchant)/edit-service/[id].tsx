import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, Pressable,
    ActivityIndicator, ScrollView, Switch, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Save, Trash2, Layers, Clock, IndianRupee } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi, MerchantService } from '../../../lib/merchant';
import { useToast } from '../../../context/ToastContext';

export default function EditServiceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();

    const [service, setService] = useState<MerchantService | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const fetchService = useCallback(async () => {
        try {
            const res = await merchantApi.listServices();
            const found = res.data.services.find((s: MerchantService) => s.id === id);
            if (found) {
                setService(found);
                setPrice(found.price.toString());
                setUnit(found.unit ?? '');
                setDescription(found.description ?? '');
                setIsActive(found.isActive);
            }
        } catch { showError('Failed to load service'); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchService(); }, [fetchService]);

    const handleSave = async () => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice <= 0) {
            showInfo('Please enter a valid price');
            return;
        }
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await merchantApi.updateService(id, {
                price: numPrice,
                unit: unit.trim() || undefined,
                description: description.trim() || undefined,
                isActive,
            });
            showSuccess('Service updated successfully');
            router.back();
        } catch { showError('Failed to update service'); }
        finally { setSaving(false); }
    };

    const handleDelete = () => {
        Alert.alert(
            'Remove Service',
            `Are you sure you want to remove "${service?.service?.name}" from your catalog? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        try {
                            await merchantApi.disableService(id);
                            showSuccess('Service removed');
                            router.back();
                        } catch { showError('Failed to remove service'); }
                        finally { setDeleting(false); }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>Service not found</Text>
                <Pressable onPress={() => router.back()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Edit Service</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Service Info Card (read-only) */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <View style={styles.infoCard}>
                            <Text style={styles.serviceName}>{service.service.name}</Text>
                            <View style={styles.metaRow}>
                                <View style={[styles.categoryBadge, { backgroundColor: Colors.primary + '12' }]}>
                                    <Layers size={10} color={Colors.primary} strokeWidth={2.5} />
                                    <Text style={[styles.categoryText, { color: Colors.primary }]}>
                                        {service.service.category?.name}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Clock size={12} color="#94A3B8" strokeWidth={2} />
                                    <Text style={styles.metaText}>{service.service.duration ?? 60} min</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IndianRupee size={12} color="#94A3B8" strokeWidth={2} />
                                    <Text style={styles.metaText}>Base: ₹{service.service.basePrice}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Editable Fields */}
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pricing</Text>
                            <View style={styles.fieldRow}>
                                <Text style={styles.label}>Your Price (₹)</Text>
                                <View style={styles.priceInputWrap}>
                                    <Text style={styles.currency}>₹</Text>
                                    <TextInput
                                        style={styles.priceField}
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.label}>Unit</Text>
                                <TextInput
                                    style={styles.input}
                                    value={unit}
                                    onChangeText={setUnit}
                                    placeholder="e.g., per hour, per visit"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe your service offering..."
                                placeholderTextColor="#CBD5E1"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <View style={styles.section}>
                            <View style={styles.toggleRow}>
                                <View>
                                    <Text style={styles.sectionTitle}>Availability</Text>
                                    <Text style={styles.toggleHint}>
                                        {isActive ? 'Visible to customers' : 'Hidden from customers'}
                                    </Text>
                                </View>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: '#E2E8F0', true: Colors.primary + '40' }}
                                    thumbColor={isActive ? Colors.primary : '#94A3B8'}
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <Pressable
                            onPress={handleSave}
                            disabled={saving}
                            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF8533']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Save size={18} color="#FFF" strokeWidth={2.5} />
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>

                    {/* Delete Button */}
                    <Animated.View entering={FadeInDown.delay(600).springify()}>
                        <Pressable
                            onPress={handleDelete}
                            disabled={deleting}
                            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                                    <Text style={styles.deleteBtnText}>Remove from Catalog</Text>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    errorText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
    backLink: { marginTop: 16 },
    backLinkText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    content: { padding: Spacing.lg, paddingBottom: 100, gap: 16 },

    infoCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    serviceName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    categoryText: { fontSize: 10, fontWeight: '800' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

    section: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

    fieldRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    priceInputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F8FAFC', borderRadius: 12,
        borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 12,
    },
    currency: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    priceField: {
        fontSize: 16, fontWeight: '800', color: '#0F172A',
        minWidth: 80, textAlign: 'right', paddingVertical: 10, paddingHorizontal: 4,
    },
    input: {
        flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: '#0F172A', fontWeight: '500',
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },

    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    toggleHint: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 16, gap: 8,
    },
    saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 48, borderRadius: 14, gap: 8,
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    },
    deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
