import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { catalogApi, type Category, type Service } from '../../lib/marketplace';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'cleaning': 'sparkles',
    'plumbing': 'water',
    'electrical': 'flash',
    'painting': 'color-palette',
    'ac-repair': 'snow',
    'carpentry': 'hammer',
    'pest-control': 'bug',
    'appliance-repair': 'settings',
};

type SortByOption = 'name' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { value: SortByOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'name', label: 'Name', icon: 'text' },
    { value: 'price_asc', label: 'Price: Low', icon: 'arrow-up' },
    { value: 'price_desc', label: 'Price: High', icon: 'arrow-down' },
    { value: 'rating', label: 'Rating', icon: 'star' },
];

export default function ExploreScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortByOption>('name');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await catalogApi.listCategories();
            setCategories(data.categories);
        } catch { /* silent */ }
    }, []);

    const fetchServices = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        try {
            const { data } = await catalogApi.listServices({
                categoryId: selectedCategory || undefined,
                search: search || undefined,
                sortBy,
                page: pageNum,
                limit: 15,
            });
            if (append) {
                setServices(prev => [...prev, ...data.services]);
            } else {
                setServices(data.services);
            }
            setTotalCount(data.pagination.total);
            setHasMore(pageNum < data.pagination.totalPages);
        } catch { /* silent */ }
        setIsLoading(false);
        setIsLoadingMore(false);
    }, [selectedCategory, search, sortBy]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => {
        setPage(1);
        fetchServices(1, false);
    }, [fetchServices]);

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            const next = page + 1;
            setPage(next);
            fetchServices(next, true);
        }
    };

    const renderCategoryChip = ({ item }: { item: Category }) => {
        const isActive = selectedCategory === item.id;
        return (
            <Pressable
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(isActive ? null : item.id)}
            >
                <Ionicons
                    name={CATEGORY_ICONS[item.slug] || 'grid'}
                    size={18}
                    color={isActive ? '#fff' : Colors.text}
                />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {item.name}
                </Text>
            </Pressable>
        );
    };

    const renderServiceCard = ({ item }: { item: Service }) => {
        const merchantCount = item._count?.merchantServices || 0;
        return (
            <Pressable
                style={styles.serviceCard}
                onPress={() => router.push(`/(booking)/${item.slug}`)}
            >
                <View style={styles.serviceIcon}>
                    <Ionicons
                        name={CATEGORY_ICONS[item.category?.slug || ''] || 'construct'}
                        size={28}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                        {item.description}
                    </Text>
                    <View style={styles.serviceFooter}>
                        <Text style={styles.servicePrice}>₹{item.basePrice}</Text>
                        <Text style={styles.serviceUnit}>/ {item.unit.replace('_', ' ')}</Text>
                        <View style={styles.durationBadge}>
                            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                            <Text style={styles.durationText}>{item.duration} min</Text>
                        </View>
                        {merchantCount > 0 && (
                            <View style={styles.providerBadge}>
                                <Ionicons name="storefront-outline" size={12} color={Colors.primary} />
                                <Text style={styles.providerText}>{merchantCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </Pressable>
        );
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.footerText}>Loading more...</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Search + Filter Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services..."
                        placeholderTextColor={Colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                        </Pressable>
                    )}
                </View>
                <Pressable
                    style={[styles.filterToggle, showFilter && styles.filterToggleActive]}
                    onPress={() => setShowFilter(true)}
                >
                    <Ionicons name="options-outline" size={20} color={showFilter ? '#fff' : Colors.text} />
                </Pressable>
            </View>

            {/* Sort Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortRow}
            >
                {SORT_OPTIONS.map(opt => {
                    const isActive = sortBy === opt.value;
                    return (
                        <Pressable
                            key={opt.value}
                            style={[styles.sortChip, isActive && styles.sortChipActive]}
                            onPress={() => setSortBy(opt.value)}
                        >
                            <Ionicons name={opt.icon} size={14} color={isActive ? '#fff' : Colors.textSecondary} />
                            <Text style={[styles.sortText, isActive && styles.sortTextActive]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{totalCount} services</Text>
                </View>
            </ScrollView>

            {/* Category Chips */}
            <View style={styles.chipsWrapper}>
                <FlatList
                    data={categories}
                    renderItem={renderCategoryChip}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsList}
                />
            </View>

            {/* Services List */}
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : services.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyText}>No services found</Text>
                    <Text style={styles.emptySubtext}>Try a different category or search term</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderServiceCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.servicesList}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={renderFooter}
                />
            )}

            {/* Filter Modal */}
            <Modal visible={showFilter} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowFilter(false)} />
                    <View style={styles.filterPanel}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Filters</Text>
                            <Pressable onPress={() => setShowFilter(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </Pressable>
                        </View>

                        <Text style={styles.filterLabel}>Sort By</Text>
                        {SORT_OPTIONS.map(opt => {
                            const isActive = sortBy === opt.value;
                            return (
                                <Pressable
                                    key={opt.value}
                                    style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                    onPress={() => {
                                        setSortBy(opt.value);
                                        setShowFilter(false);
                                    }}
                                >
                                    <Ionicons name={opt.icon} size={20} color={isActive ? Colors.primary : Colors.textSecondary} />
                                    <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
                                        {opt.label}
                                    </Text>
                                    {isActive && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                                </Pressable>
                            );
                        })}

                        <Text style={[styles.filterLabel, { marginTop: Spacing.lg }]}>Category</Text>
                        <Pressable
                            style={[styles.filterOption, !selectedCategory && styles.filterOptionActive]}
                            onPress={() => { setSelectedCategory(null); setShowFilter(false); }}
                        >
                            <Text style={[styles.filterOptionText, !selectedCategory && styles.filterOptionTextActive]}>All Categories</Text>
                        </Pressable>
                        {categories.map(cat => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <Pressable
                                    key={cat.id}
                                    style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                    onPress={() => { setSelectedCategory(cat.id); setShowFilter(false); }}
                                >
                                    <Ionicons name={CATEGORY_ICONS[cat.slug] || 'grid'} size={20} color={isActive ? Colors.primary : Colors.textSecondary} />
                                    <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{cat.name}</Text>
                                    {isActive && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, height: 48, gap: Spacing.sm,
    },
    searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
    filterToggle: {
        width: 48, height: 48, borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
    },
    filterToggleActive: { backgroundColor: Colors.primary },
    // ─── Sort Row ───
    sortRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm, alignItems: 'center' },
    sortChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.sm + 2, paddingVertical: 6,
        borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundAlt,
    },
    sortChipActive: { backgroundColor: Colors.primary },
    sortText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
    sortTextActive: { color: '#fff' },
    countBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.primary + '15' },
    countText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    // ─── Category Chips ───
    chipsWrapper: { paddingBottom: Spacing.sm },
    chipsList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    categoryChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundAlt, gap: 6,
    },
    categoryChipActive: { backgroundColor: Colors.primary },
    chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    chipTextActive: { color: '#fff' },
    // ─── List ───
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
    servicesList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    separator: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },
    serviceCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
    serviceIcon: {
        width: 56, height: 56, borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center',
    },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    serviceDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
    serviceFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, gap: 4 },
    servicePrice: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
    serviceUnit: { fontSize: FontSize.xs, color: Colors.textMuted },
    durationBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm, gap: 3 },
    durationText: { fontSize: FontSize.xs, color: Colors.textMuted },
    providerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        marginLeft: Spacing.sm, backgroundColor: Colors.primary + '10',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full,
    },
    providerText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
    // ─── Footer ───
    footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
    footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
    // ─── Filter Modal ───
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    filterPanel: {
        backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl,
        maxHeight: '70%',
    },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    filterTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    filterLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
    filterOption: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg, marginBottom: Spacing.xs,
    },
    filterOptionActive: { backgroundColor: Colors.primary + '10' },
    filterOptionText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
    filterOptionTextActive: { fontWeight: '700', color: Colors.primary },
});
