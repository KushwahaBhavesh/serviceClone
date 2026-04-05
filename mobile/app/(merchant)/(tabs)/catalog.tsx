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
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    Clock,
    IndianRupee,
    ShoppingBag,
    Layers,
    Plus,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi, MerchantService } from '../../../lib/merchant';
import { useToast } from '../../../context/ToastContext';

export default function MerchantCatalogScreen() {
    const { showError } = useToast();
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

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [fetchServices])
    );
    const onRefresh = () => { setRefreshing(true); fetchServices(); };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            await merchantApi.updateService(id, { isActive: !currentActive });
            setServices((prev) =>
                prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s)),
            );
        } catch { showError('Failed to update service'); }
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
            } catch { showError('Failed to update price'); }
        }, 500);
    }, []);

    const renderServiceCard = useCallback(({ item, index }: { item: MerchantService; index: number }) => (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
            <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{item.service.name}</Text>
                        <View style={[styles.categoryBadge, { backgroundColor: Colors.primary + '12' }]}>
                            <Layers size={10} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.categoryText, { color: Colors.primary }]}>{item.service.category?.name}</Text>
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
            <StatusBar style="dark" translucent />
            
            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={styles.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.title}>Service Catalog</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{services.length} SERVICES</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={services}
                renderItem={renderServiceCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.list,
                    { paddingTop: insets.top + 70 }
                ]}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={[Colors.primary]} 
                        progressViewOffset={insets.top + 60}
                    />
                }
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
                    style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
                    onPress={() => router.push('/(merchant)/add-service')}
                >
                    <LinearGradient
                        colors={[Colors.primary, '#FF8533']}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Plus color="#FFF" size={24} strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    
    // Header
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    countBadge: {
        backgroundColor: Colors.primary + '12',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    countText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 0.5,
    },

    // FAB
    fabContainer: {
        position: 'absolute',
        right: Spacing.xl,
        zIndex: 10,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        overflow: 'hidden',
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    list: { padding: Spacing.lg, paddingBottom: 120, gap: 12 },

    // Cards
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
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
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingHorizontal: 12,
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
        paddingVertical: 100,
        gap: 8,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#334155',
    },
    emptyHint: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
