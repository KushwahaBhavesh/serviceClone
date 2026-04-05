import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import {
    Search,
    Info,
    ChevronLeft,
    Plus,
    LayoutGrid,
    PlusCircle,
    Check,
    Clock,
    IndianRupee,
    Layers,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import { catalogApi, Service, Category, ServiceUnit } from '../../lib/marketplace';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const { width: SCREEN_W } = Dimensions.get('window');

type TabMode = 'platform' | 'custom';


export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();

    const [tab, setTab] = useState<TabMode>('platform');
    const [units, setUnits] = useState<ServiceUnit[]>([]);

    // Platform tab state
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [price, setPrice] = useState('');
    const [priceUnit, setPriceUnit] = useState('visit');
    const [platformDescription, setPlatformDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Custom tab state
    const [categories, setCategories] = useState<Category[]>([]);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [customCategoryId, setCustomCategoryId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customUnit, setCustomUnit] = useState('visit');
    const [customDuration, setCustomDuration] = useState('60');
    const [customSubmitting, setCustomSubmitting] = useState(false);

    const loadPlatformServices = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const res = await catalogApi.listServices({ search: query, limit: 50 });
            setServices(res.data.services);
        } catch (error) {
            console.error('Failed to load services:', error);
            showError('Failed to load platform services');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlatformServices();
        catalogApi.listCategories().then(res => {
            setCategories(res.data.categories);
        }).catch(() => { });

        catalogApi.listUnits().then(res => {
            setUnits(res.data.units);
            if (res.data.units.length > 0) {
                setPriceUnit(res.data.units[0].name);
                setCustomUnit(res.data.units[0].name);
            }
        }).catch(() => { });
    }, [loadPlatformServices]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadPlatformServices(searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, loadPlatformServices]);

    const handleEnableService = async () => {
        if (!selectedService) return;
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            showInfo('Please enter a valid price for this service.');
            return;
        }

        setSubmitting(true);
        try {
            await merchantApi.enableService({
                serviceId: selectedService.id,
                price: numericPrice,
                unit: priceUnit,
                description: platformDescription.trim() || undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSuccess('Service enabled successfully!');
            router.back();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to enable service.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCustom = async () => {
        if (!customName.trim()) return showInfo('Please enter a service name.');
        if (!customCategoryId) return showInfo('Please select a category.');
        const numericPrice = parseFloat(customPrice);
        if (isNaN(numericPrice) || numericPrice <= 0) return showInfo('Please enter a valid price.');

        setCustomSubmitting(true);
        try {
            await merchantApi.createCustomService({
                name: customName.trim(),
                description: customDescription.trim() || undefined,
                categoryId: customCategoryId,
                price: numericPrice,
                unit: customUnit,
                duration: parseInt(customDuration) || 60,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSuccess('Custom service created successfully!');
            router.back();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to create service.');
        } finally {
            setCustomSubmitting(false);
        }
    };

    const renderServiceItem = ({ item, index }: { item: Service, index: number }) => {
        const isSelected = selectedService?.id === item.id;

        return (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 40).springify()}>
                <Pressable
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedService(item);
                        setPrice(item.basePrice.toString());
                        setPlatformDescription(''); // Reset description on select
                    }}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{item.category?.name || 'Service'}</Text>
                            </View>
                        </View>
                        <View style={[styles.selector, isSelected && styles.selectorActive]}>
                            {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.metaItem}>
                            <IndianRupee size={12} color="#94A3B8" />
                            <Text style={styles.metaText}>Base: ₹{item.basePrice}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Clock size={12} color="#94A3B8" />
                            <Text style={styles.metaText}>{item.duration} mins</Text>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar style="dark" translucent />

            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={styles.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Add Service</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: selectedService ? 340 : 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ─── Tab Switcher ─── */}
                <View style={styles.tabWrapper}>
                    <View style={styles.tabPill}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setTab('platform');
                            }}
                            style={[styles.tabItem, tab === 'platform' && styles.tabItemActive]}
                        >
                            <LayoutGrid size={16} color={tab === 'platform' ? Colors.primary : '#94A3B8'} strokeWidth={tab === 'platform' ? 2.5 : 2} />
                            <Text style={[styles.tabText, tab === 'platform' && styles.tabTextActive]}>Platform</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setTab('custom');
                            }}
                            style={[styles.tabItem, tab === 'custom' && styles.tabItemActive]}
                        >
                            <PlusCircle size={16} color={tab === 'custom' ? Colors.primary : '#94A3B8'} strokeWidth={tab === 'custom' ? 2.5 : 2} />
                            <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>Custom</Text>
                        </Pressable>
                    </View>
                </View>

                {tab === 'platform' ? (
                    <Animated.View entering={FadeIn} style={styles.tabContent}>
                        <View style={styles.searchBox}>
                            <Search size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search official services..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {loading && services.length === 0 ? (
                            <View style={styles.loader}>
                                <ActivityIndicator color={Colors.primary} />
                            </View>
                        ) : (
                            <View style={styles.serviceList}>
                                {services.map((item, idx) => renderServiceItem({ item, index: idx }))}
                            </View>
                        )}

                        {services.length === 0 && !loading && (
                            <View style={styles.emptyState}>
                                <Info size={32} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No platform services found.</Text>
                            </View>
                        )}
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeIn} style={styles.tabContent}>
                        <View style={styles.bentoCard}>
                            <Text style={styles.cardLabel}>General Info</Text>
                            <TextInput
                                style={styles.luxeInput}
                                placeholder="Service Name (e.g. Deep Sofa Cleaning)"
                                placeholderTextColor="#94A3B8"
                                value={customName}
                                onChangeText={setCustomName}
                            />
                            <View style={styles.divider} />
                            <TextInput
                                style={[styles.luxeInput, styles.luxeTextArea]}
                                placeholder="Description of your professional service..."
                                placeholderTextColor="#94A3B8"
                                value={customDescription}
                                onChangeText={setCustomDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.bentoCard}>
                            <Text style={styles.cardLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                                {categories.map(cat => (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => setCustomCategoryId(cat.id)}
                                        style={[styles.categoryChip, customCategoryId === cat.id && styles.chipActive]}
                                    >
                                        <Text style={[styles.chipText, customCategoryId === cat.id && styles.chipTextActive]}>
                                            {cat.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.bentoCard, { flex: 1 }]}>
                                <Text style={styles.cardLabel}>Pricing (₹)</Text>
                                <TextInput
                                    style={styles.luxeInput}
                                    placeholder="500"
                                    placeholderTextColor="#94A3B8"
                                    value={customPrice}
                                    onChangeText={setCustomPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.bentoCard, { flex: 1 }]}>
                                <Text style={styles.cardLabel}>Time (Mins)</Text>
                                <TextInput
                                    style={styles.luxeInput}
                                    placeholder="60"
                                    placeholderTextColor="#94A3B8"
                                    value={customDuration}
                                    onChangeText={setCustomDuration}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        
                        <View style={styles.divider} />
                        <Text style={styles.cardLabel}>Pricing Unit</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitScroll}>
                            {units.map(u => {
                                const active = customUnit === u.name;
                                return (
                                    <Pressable
                                        key={u.id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCustomUnit(u.name);
                                        }}
                                        style={[styles.unitChip, active && styles.unitChipActive]}
                                    >
                                        <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>{u.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <View style={{ marginTop: 24 }}>
                            <Button
                                title="Create Service"
                                onPress={handleCreateCustom}
                                loading={customSubmitting}
                                disabled={customSubmitting || !customName.trim() || !customCategoryId || !customPrice}
                            />
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            {/* ─── Price Selection Sheet (Mini) ─── */}
            {selectedService && tab === 'platform' && (
                <Animated.View entering={FadeInDown.springify()} exiting={FadeOut} style={[styles.priceSheet, { paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Set Your Offer Price</Text>
                        <Text style={styles.sheetSubtitle}>Enter the price you'll charge for this service.</Text>
                    </View>

                    <View style={styles.priceInputWrapper}>
                        <LinearGradient
                            colors={['#F8FAFC', '#F1F5F9']}
                            style={styles.priceGradient}
                        >
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                style={styles.giantPriceInput}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                                autoFocus
                                placeholder="0"
                            />
                        </LinearGradient>
                    </View>
                    
                    <View style={styles.sheetUnitWrapper}>
                        <Text style={styles.sheetLabel}>PRICING UNIT</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitScroll}>
                            {units.map(u => {
                                const active = priceUnit === u.name;
                                return (
                                    <Pressable
                                        key={u.id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setPriceUnit(u.name);
                                        }}
                                        style={[styles.unitChip, active && styles.unitChipActive]}
                                    >
                                        <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>{u.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={styles.sheetDescriptionWrapper}>
                        <Text style={styles.sheetLabel}>CUSTOM DESCRIPTION (OPTIONAL)</Text>
                        <TextInput
                            style={styles.sheetTextArea}
                            placeholder="Add your own professional touch to this service description..."
                            placeholderTextColor="#94A3B8"
                            value={platformDescription}
                            onChangeText={setPlatformDescription}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <Button
                        title="Add to My Catalog"
                        onPress={handleEnableService}
                        loading={submitting}
                        disabled={submitting || !price}
                    />
                </Animated.View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    navBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },

    // Tabs
    tabWrapper: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 12 },
    tabPill: {
        flexDirection: 'row', backgroundColor: '#FFF', padding: 4, borderRadius: 16,
        borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8,
    },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
    tabItemActive: { backgroundColor: Colors.primary + '10' },
    tabText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
    tabTextActive: { color: Colors.primary },

    // Content
    tabContent: { paddingHorizontal: 20, gap: 16 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 52, borderRadius: 16, paddingHorizontal: 16, gap: 12,
        borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '600' },
    loader: { paddingVertical: 40, alignItems: 'center' },
    serviceList: { gap: 12 },

    // Service Cards
    serviceCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10,
    },
    serviceCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '03' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { flex: 1, gap: 6 },
    serviceName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    categoryText: { fontSize: 10, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' },
    selector: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    selectorActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    cardFooter: { flexDirection: 'row', marginTop: 14, gap: 12, alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    metaDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '500' },

    // Bento (Custom Tab)
    bentoCard: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16,
    },
    cardLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    luxeInput: { fontSize: 15, fontWeight: '700', color: '#0F172A', paddingVertical: 4 },
    luxeTextArea: { minHeight: 80, textAlignVertical: 'top' },
    divider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 12 },
    row: { flexDirection: 'row', gap: 12 },
    chipScroll: { gap: 8 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    chipActive: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
    chipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    chipTextActive: { color: Colors.primary },

    // Price Sheet
    priceSheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 20,
    },
    sheetHeader: { alignItems: 'center', marginBottom: 24 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', marginBottom: 16 },
    sheetTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    sheetSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    priceInputWrapper: { marginBottom: 24 },
    priceGradient: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 24, height: 100 },
    currencySymbol: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginRight: 12 },
    giantPriceInput: { flex: 1, fontSize: 44, fontWeight: '900', color: Colors.primary },
    sheetDescriptionWrapper: { marginBottom: 24, paddingHorizontal: 4 },
    sheetLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 8 },
    sheetTextArea: {
        backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 14, fontWeight: '600', color: '#0F172A',
        minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#F1F5F9',
    },
    sheetUnitWrapper: { marginBottom: 24, paddingHorizontal: 4 },
    unitScroll: { gap: 10 },
    unitChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    unitChipActive: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
    unitChipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    unitChipTextActive: { color: Colors.primary },
});
