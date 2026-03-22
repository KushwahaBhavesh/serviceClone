import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Switch,
    TextInput,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    Clock,
    IndianRupee,
    ShoppingBag,
    Layers,
    Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi, MerchantService } from '../../../lib/merchant';

export default function MerchantCatalogScreen() {
    const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [services, setServices] = useState<MerchantService[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchServices = useCallback(async () => {
        try {
            const response = await merchantApi.listServices();
            setServices(response.data.services);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);
    const onRefresh = () => { setRefreshing(true); fetchServices(); };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            await merchantApi.updateService(id, { isActive: !currentActive });
            setServices((prev) =>
                prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s)),
            );
        } catch { Alert.alert('Error', 'Failed to update service'); }
    };

    const handlePriceUpdate = useCallback((id: string, newPrice: string) => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price <= 0) return;
        if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
        priceDebounceRef.current = setTimeout(async () => {
            try {
                await merchantApi.updateService(id, { price });
                setServices((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, price } : s)),
                );
            } catch { Alert.alert('Error', 'Failed to update price'); }
        }, 500);
    }, []);

    const renderServiceCard = useCallback(({ item, index }: { item: MerchantService; index: number }) => (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
            <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{item.service.name}</Text>
                        <View style={styles.categoryBadge}>
                            <Layers size={10} color="#6366F1" strokeWidth={2.5} />
                            <Text style={styles.categoryText}>{item.service.category?.name}</Text>
                        </View>
                    </View>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => handleToggle(item.id, item.isActive)}
                        trackColor={{ false: '#E2E8F0', true: Colors.primary + '40' }}
                        thumbColor={item.isActive ? Colors.primary : '#94A3B8'}
                    />
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Price row */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Your Price</Text>
                    <View style={styles.priceInputWrap}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.priceField}
                            defaultValue={item.price.toString()}
                            keyboardType="numeric"
                            onEndEditing={(e) => handlePriceUpdate(item.id, e.nativeEvent.text)}
                            placeholder="0"
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>
                </View>

                {/* Meta */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Clock size={12} color="#94A3B8" strokeWidth={2} />
                        <Text style={styles.metaText}>{item.service.duration ?? 60} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <IndianRupee size={12} color="#94A3B8" strokeWidth={2} />
                        <Text style={styles.metaText}>Base: ₹{item.service.basePrice}</Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    ), [handleToggle, handlePriceUpdate]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Text style={styles.title}>Service Catalog</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{services.length} services</Text>
                </View>
            </View>

            <FlatList
                data={services}
                renderItem={renderServiceCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={8}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <ShoppingBag size={32} color="#CBD5E1" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No services configured</Text>
                        <Text style={styles.emptyHint}>Enable services from the platform catalog</Text>
                    </View>
                }
            />

            <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
                <Pressable
                    style={styles.fab}
                    onPress={() => router.push('/(merchant)/add-service')}
                >
                    <Plus color="#FFF" size={24} strokeWidth={2.5} />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    fabContainer: {
        position: 'absolute',
        right: Spacing.xl,
        zIndex: 10,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },

    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    countBadge: {
        backgroundColor: Colors.primary + '12',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 4,
    },
    countText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.primary,
    },

    list: { padding: Spacing.lg, paddingBottom: 100, gap: 12 },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardInactive: { opacity: 0.5 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    serviceInfo: { flex: 1, marginRight: 12 },
    serviceName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6366F1',
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    priceInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingHorizontal: 10,
    },
    currency: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    priceField: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        minWidth: 70,
        textAlign: 'right',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },

    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },

    empty: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 8,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    emptyHint: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
