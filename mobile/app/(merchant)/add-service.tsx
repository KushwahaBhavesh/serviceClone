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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Search, Info } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import { catalogApi, Service, Category } from '../../lib/marketplace';
import { Button } from '../../components/ui/Button';

type TabMode = 'platform' | 'custom';

export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [tab, setTab] = useState<TabMode>('platform');

    // Platform tab state
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Custom tab state
    const [categories, setCategories] = useState<Category[]>([]);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [customCategoryId, setCustomCategoryId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customDuration, setCustomDuration] = useState('60');
    const [customSubmitting, setCustomSubmitting] = useState(false);

    const loadPlatformServices = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const res = await catalogApi.listServices({ search: query, limit: 50 });
            setServices(res.data.services);
        } catch (error) {
            console.error('Failed to load services:', error);
            Alert.alert('Error', 'Failed to load platform services');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlatformServices();
        // Load categories for custom tab
        catalogApi.listCategories().then(res => {
            setCategories(res.data.categories);
        }).catch(() => {});
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
            Alert.alert('Invalid Price', 'Please enter a valid price for this service.');
            return;
        }

        setSubmitting(true);
        try {
            await merchantApi.enableService({
                serviceId: selectedService.id,
                price: numericPrice,
            });
            Alert.alert('Success', 'Service enabled successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to enable service.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCustom = async () => {
        if (!customName.trim()) {
            Alert.alert('Required', 'Please enter a service name.');
            return;
        }
        if (!customCategoryId) {
            Alert.alert('Required', 'Please select a category.');
            return;
        }
        const numericPrice = parseFloat(customPrice);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }

        setCustomSubmitting(true);
        try {
            await merchantApi.createCustomService({
                name: customName.trim(),
                description: customDescription.trim() || undefined,
                categoryId: customCategoryId,
                price: numericPrice,
                duration: parseInt(customDuration) || 60,
            });
            Alert.alert('Success', 'Custom service created and enabled!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create service.');
        } finally {
            setCustomSubmitting(false);
        }
    };

    const renderServiceItem = ({ item, index }: { item: Service, index: number }) => {
        const isSelected = selectedService?.id === item.id;
        
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => {
                        setSelectedService(item);
                        setPrice(item.basePrice.toString());
                    }}
                >
                    <View style={styles.serviceHeader}>
                        <Text style={[styles.serviceName, isSelected && styles.textPrimary]}>
                            {item.name}
                        </Text>
                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                        </View>
                    </View>
                    
                    {item.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category.name}</Text>
                        </View>
                    )}
                    
                    <View style={styles.serviceFooter}>
                        <Text style={styles.serviceMeta}>Base Price: ₹{item.basePrice}</Text>
                        <Text style={styles.serviceMeta}>•</Text>
                        <Text style={styles.serviceMeta}>{item.duration} mins</Text>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    const renderPlatformTab = () => (
        <>
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                        </Pressable>
                    )}
                </View>
            </View>

            {loading && services.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id}
                    renderItem={renderServiceItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Info size={32} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No services found.</Text>
                        </View>
                    }
                />
            )}

            {selectedService && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.bottomSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Set Your Price</Text>
                        <Text style={styles.sheetSubtitle}>Pick a competitive price for "{selectedService.name}"</Text>
                    </View>
                    
                    <View style={styles.priceRow}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.priceInput}
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0"
                        />
                    </View>
                    
                    <Button
                        title="Enable Service"
                        onPress={handleEnableService}
                        loading={submitting}
                        disabled={submitting || !price}
                    />
                </Animated.View>
            )}
        </>
    );

    const renderCustomTab = () => (
        <ScrollView
            contentContainerStyle={styles.customForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Service Name */}
            <Text style={styles.fieldLabel}>Service Name *</Text>
            <TextInput
                style={styles.textField}
                placeholder="e.g. Deep Bathroom Cleaning"
                placeholderTextColor="#94A3B8"
                value={customName}
                onChangeText={setCustomName}
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>Category *</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
            >
                {categories.map(cat => (
                    <Pressable
                        key={cat.id}
                        style={[
                            styles.chip,
                            customCategoryId === cat.id && styles.chipActive,
                        ]}
                        onPress={() => setCustomCategoryId(cat.id)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                customCategoryId === cat.id && styles.chipTextActive,
                            ]}
                        >
                            {cat.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
                style={[styles.textField, styles.textArea]}
                placeholder="Brief description of the service..."
                placeholderTextColor="#94A3B8"
                value={customDescription}
                onChangeText={setCustomDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />

            {/* Price + Duration Row */}
            <View style={styles.rowFields}>
                <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>Price (₹) *</Text>
                    <TextInput
                        style={styles.textField}
                        placeholder="500"
                        placeholderTextColor="#94A3B8"
                        value={customPrice}
                        onChangeText={setCustomPrice}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>Duration (min)</Text>
                    <TextInput
                        style={styles.textField}
                        placeholder="60"
                        placeholderTextColor="#94A3B8"
                        value={customDuration}
                        onChangeText={setCustomDuration}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={{ height: Spacing.xl }} />

            <Button
                title="Create & Enable Service"
                onPress={handleCreateCustom}
                loading={customSubmitting}
                disabled={customSubmitting || !customName.trim() || !customCategoryId || !customPrice}
            />

            <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                </Pressable>
                <Text style={styles.title}>Add Service</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, tab === 'platform' && styles.tabActive]}
                    onPress={() => setTab('platform')}
                >
                    <Ionicons
                        name="grid-outline"
                        size={16}
                        color={tab === 'platform' ? Colors.primary : '#94A3B8'}
                    />
                    <Text style={[styles.tabText, tab === 'platform' && styles.tabTextActive]}>
                        Platform Services
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, tab === 'custom' && styles.tabActive]}
                    onPress={() => setTab('custom')}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={16}
                        color={tab === 'custom' ? Colors.primary : '#94A3B8'}
                    />
                    <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>
                        Create Custom
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView 
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {tab === 'platform' ? renderPlatformTab() : renderCustomTab()}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },

    // ─── Tabs ───
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        gap: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
    },
    tabActive: {
        backgroundColor: Colors.primary + '12',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },

    // ─── Platform Tab ───
    searchContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
    },
    
    list: {
        padding: Spacing.lg,
        gap: 12,
        paddingBottom: 240,
    },
    
    serviceCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    serviceCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '05',
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    serviceName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    textPrimary: {
        color: Colors.primary,
    },
    
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    radioSelected: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    
    categoryBadge: {
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366F1',
    },
    
    serviceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceMeta: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    
    empty: {
        paddingTop: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
    },
    
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    sheetHeader: {
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    sheetSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    currency: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        paddingVertical: 16,
    },

    // ─── Custom Tab ───
    customForm: {
        padding: Spacing.xl,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        marginTop: 16,
    },
    textField: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        minHeight: 90,
        paddingTop: 14,
    },
    categoryChips: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: Colors.primary + '12',
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    chipTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    rowFields: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
});
