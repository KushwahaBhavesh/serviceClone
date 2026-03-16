import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Switch,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { merchantApi, MerchantService } from '../../../lib/merchant';

export default function MerchantCatalogScreen() {
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
        } catch {
            Alert.alert('Error', 'Failed to update service');
        }
    };

    const handlePriceUpdate = async (id: string, newPrice: string) => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price <= 0) return;
        try {
            await merchantApi.updateService(id, { price });
            setServices((prev) =>
                prev.map((s) => (s.id === id ? { ...s, price } : s)),
            );
        } catch {
            Alert.alert('Error', 'Failed to update price');
        }
    };

    const renderServiceCard = ({ item }: { item: MerchantService }) => (
        <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={styles.cardHeader}>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.service.name}</Text>
                    <Text style={styles.categoryChip}>{item.service.category?.name}</Text>
                </View>
                <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggle(item.id, item.isActive)}
                    trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                    thumbColor={item.isActive ? Colors.primary : Colors.textMuted}
                />
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Your Price</Text>
                <View style={styles.priceInput}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                        style={styles.priceField}
                        defaultValue={item.price.toString()}
                        keyboardType="numeric"
                        onEndEditing={(e) => handlePriceUpdate(item.id, e.nativeEvent.text)}
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                    />
                </View>
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    <Ionicons name="time" size={12} color={Colors.textSecondary} /> {item.service.duration ?? 60} min
                </Text>
                <Text style={styles.metaText}>Base: ₹{item.service.basePrice}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Service Catalog</Text>
                <Text style={styles.subtitle}>{services.length} services enabled</Text>
            </View>

            <FlatList
                data={services}
                renderItem={renderServiceCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No services configured yet</Text>
                        <Text style={styles.emptyHint}>Enable services from the platform catalog</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundAlt },

    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    list: { padding: Spacing.md, gap: Spacing.sm },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    cardInactive: { opacity: 0.6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    serviceInfo: { flex: 1, marginRight: Spacing.sm },
    serviceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    categoryChip: {
        fontSize: FontSize.xs,
        color: Colors.secondary,
        backgroundColor: Colors.secondary + '10',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: 4,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    priceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
    priceInput: { flexDirection: 'row', alignItems: 'center' },
    currency: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginRight: 2 },
    priceField: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        minWidth: 80,
        textAlign: 'right',
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.sm,
    },

    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
    metaText: { fontSize: FontSize.xs, color: Colors.textMuted },

    empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted },
});
