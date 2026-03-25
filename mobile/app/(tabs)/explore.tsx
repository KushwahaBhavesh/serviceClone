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
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { catalogApi, type Category, type Service, type NearbyMerchant } from '../../lib/marketplace';
import { getImageUrl } from '../../lib/api';

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
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [categories, setCategories] = useState<Category[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [merchants, setMerchants] = useState<NearbyMerchant[]>([]);
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
            if (viewMode === 'list') {
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
            } else {
                // Map Mode
                if (user?.latitude && user?.longitude) {
                    const { data } = await catalogApi.listNearbyMerchants({
                        latitude: user.latitude,
                        longitude: user.longitude,
                        categoryId: selectedCategory || undefined,
                        limit: 50,
                    });
                    setMerchants(data.merchants);
                }
            }
        } catch { /* silent */ }
        setIsLoading(false);
        setIsLoadingMore(false);
    }, [selectedCategory, search, sortBy, viewMode, user]);

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

    const renderServiceCard = ({ item, index }: { item: Service, index: number }) => {
        const merchantCount = item._count?.merchantServices || 0;
        const prices = (item.merchantServices || []).map(ms => ms.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : item.basePrice;
        const avgRating = (item.merchantServices || []).reduce((acc, curr) => acc + curr.merchant.rating, 0) / (item.merchantServices?.length || 1);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
            >
                <Pressable
                    style={styles.premiumCard}
                    onPress={() => router.push(`/(booking)/${item.slug}`)}
                >
                <View style={styles.cardImageContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: getImageUrl(item.imageUrl) || '' }} style={styles.cardImage} />
                    ) : (
                        <LinearGradient
                            colors={[Colors.primary + '20', Colors.primary + '05']}
                            style={styles.cardImagePlaceholder}
                        >
                            <Ionicons
                                name={CATEGORY_ICONS[item.category?.slug || ''] || 'construct'}
                                size={40}
                                color={Colors.primary}
                            />
                        </LinearGradient>
                    )}
                    {item.merchantServices && item.merchantServices.length > 0 && (
                        <View style={styles.ratingBadgeOver}>
                            <Ionicons name="star" size={12} color="#FFB800" />
                            <Text style={styles.ratingBadgeText}>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.serviceNamePremium}>{item.name}</Text>
                        {merchantCount > 5 && (
                            <View style={styles.trendingBadge}>
                                <Ionicons name="flame" size={10} color="#FF4B2B" />
                                <Text style={styles.trendingText}>POPULAR</Text>
                            </View>
                        )}
                    </View>
                    
                    <Text style={styles.serviceDescPremium} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.cardFooterPremium}>
                        <View>
                            <Text style={styles.startsFromText}>Starts from</Text>
                            <View style={styles.priceRowPremium}>
                                <Text style={styles.priceSymbol}>₹</Text>
                                <Text style={styles.priceValuePremium}>{minPrice}</Text>
                                <Text style={styles.unitTextPremium}>/ {item.unit.replace('_', ' ')}</Text>
                            </View>
                        </View>

                        <View style={styles.providerInfoPremium}>
                            <View style={styles.providerAvatars}>
                                {(item.merchantServices || []).slice(0, 3).map((ms, idx) => (
                                    <View key={ms.merchant.id} style={[styles.miniAvatar, { marginLeft: idx === 0 ? 0 : -10 }]}>
                                        {ms.merchant.logoUrl ? (
                                            <Image source={{ uri: getImageUrl(ms.merchant.logoUrl) || '' }} style={styles.miniAvatarImg} />
                                        ) : (
                                            <View style={styles.avatarLetter}>
                                                <Text style={styles.avatarLetterText}>{ms.merchant.businessName[0]}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.providerCountText}>
                                {merchantCount > 0 ? `${merchantCount} Providers` : 'Nearby'}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
            </Animated.View>
        );
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
            {/* Search + Filter Bar */}
            <View style={[styles.searchContainer, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for services..."
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
                <View style={styles.headerControls}>
                    <Pressable
                        style={[styles.filterToggle, showFilter && styles.filterToggleActive]}
                        onPress={() => setShowFilter(true)}
                    >
                        <Ionicons name="options-outline" size={20} color={showFilter ? '#fff' : Colors.text} />
                    </Pressable>
                    <Pressable
                        style={styles.viewToggleBtn}
                        onPress={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
                    >
                        <Ionicons name={viewMode === 'list' ? 'map' : 'list'} size={20} color={Colors.primary} />
                    </Pressable>
                </View>
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
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore || viewMode === 'map') return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.footerText}>Loading more...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                {viewMode === 'map' ? (
                    <>
                        {/* Map Header stays fixed in map mode */}
                        <View style={[styles.searchContainer, { paddingTop: insets.top + Spacing.sm }]}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={20} color={Colors.textMuted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search on map..."
                                    placeholderTextColor={Colors.textMuted}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                            </View>
                            <Pressable
                                style={styles.viewToggleBtn}
                                onPress={() => setViewMode('list')}
                            >
                                <Ionicons name="list" size={20} color={Colors.primary} />
                            </Pressable>
                        </View>

                        <View style={styles.mapContainer}>
                            <MapView
                                style={StyleSheet.absoluteFillObject}
                                initialRegion={user?.latitude && user?.longitude ? {
                                    latitude: user.latitude,
                                    longitude: user.longitude,
                                    latitudeDelta: 0.1,
                                    longitudeDelta: 0.1,
                                } : undefined}
                            >
                                {user?.latitude && user?.longitude && (
                                    <Marker
                                        coordinate={{ latitude: user.latitude, longitude: user.longitude }}
                                        pinColor="blue"
                                        title="You are here"
                                    />
                                )}
                                {merchants.map((merchant) => (
                                    <Marker
                                        key={merchant.id}
                                        coordinate={{ latitude: merchant.latitude!, longitude: merchant.longitude! }}
                                    >
                                        <View style={styles.markerContainer}>
                                            <Ionicons name="storefront" size={16} color="#FFF" />
                                        </View>
                                        <Callout
                                            onPress={() => router.push({
                                                pathname: '/(booking)/merchant-profile',
                                                params: { id: merchant.id },
                                            })}
                                        >
                                            <View style={styles.calloutBox}>
                                                <Text style={styles.calloutTitle}>{merchant.businessName}</Text>
                                                <Text style={styles.calloutSubtitle}>★ {merchant.rating.toFixed(1)} · {merchant.distance.toFixed(1)}km</Text>
                                                <Text style={{ fontSize: 11, color: Colors.primary, marginTop: 2 }}>Tap to view →</Text>
                                            </View>
                                        </Callout>
                                    </Marker>
                                ))}
                            </MapView>
                        </View>
                    </>
                ) : (
                    <FlatList
                        data={isLoading ? [] : services}
                        renderItem={renderServiceCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.servicesList}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={() => !isLoading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color={Colors.border} />
                                <Text style={styles.emptyText}>No services found</Text>
                                <Text style={styles.emptySubtext}>Try a different category or search term</Text>
                            </View>
                        )}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={renderFooter}
                        refreshing={isLoading && services.length > 0}
                        onRefresh={() => fetchServices(1, false)}
                    />
                )}

                {isLoading && services.length === 0 && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}
            </View>


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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    listHeader: { paddingBottom: Spacing.sm },
    searchContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.backgroundAlt, borderRadius: 24,
        paddingHorizontal: Spacing.md, height: 54, gap: Spacing.sm,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    },
    searchInput: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '700' },
    filterToggle: {
        width: 54, height: 54, borderRadius: 24,
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
    },
    filterToggleActive: { backgroundColor: Colors.primary, borderWidth: 0, shadowColor: Colors.primary, shadowOpacity: 0.2 },
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
        paddingHorizontal: Spacing.lg, paddingVertical: 12,
        borderRadius: 24, backgroundColor: '#fff', gap: 10,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 1,
    },
    categoryChipActive: { 
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    chipText: { fontSize: 13, fontWeight: '800', color: Colors.text },
    chipTextActive: { color: '#fff' },
    // ─── List ───
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
    emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
    servicesList: { paddingBottom: 160 },
    
    // ─── Premium Card ───
    premiumCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24, // Consistent 24px rounding
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    cardImageContainer: {
        width: '100%',
        height: 180, // Slightly taller for more impact
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary + '08',
    },
    ratingBadgeOver: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    ratingBadgeText: {
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },
    cardContent: {
        padding: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceNamePremium: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
        flex: 1,
    },
    trendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFE5E5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    trendingText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF4B2B',
    },
    serviceDescPremium: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    cardFooterPremium: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    startsFromText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceRowPremium: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    priceSymbol: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
        marginRight: 2,
    },
    priceValuePremium: {
        fontSize: 26,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: -1,
    },
    unitTextPremium: {
        fontSize: 14,
        color: Colors.textMuted,
        marginLeft: 4,
        fontWeight: '600',
    },
    providerInfoPremium: {
        alignItems: 'flex-end',
    },
    providerAvatars: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: Colors.backgroundAlt,
        overflow: 'hidden',
    },
    miniAvatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarLetter: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetterText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
    },
    providerCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
    },

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
    // ─── Header Controls ───
    headerControls: { flexDirection: 'row', gap: Spacing.xs },
    viewToggleBtn: {
        width: 48, height: 48, borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center',
    },
    // ─── Map View ───
    mapContainer: { flex: 1, borderRadius: BorderRadius.xl, overflow: 'hidden', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    markerContainer: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutBox: { minWidth: 150, padding: Spacing.sm },
    calloutTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
    calloutSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});

