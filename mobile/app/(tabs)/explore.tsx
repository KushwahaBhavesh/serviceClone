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
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import {
    Search,
    SlidersHorizontal,
    Map as MapIcon,
    LayoutList,
    Star,
    ChevronRight,
    Filter,
    Sparkles,
    X,
    Check,
    Navigation2,
    Clock,
    Zap
} from 'lucide-react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { catalogApi, type Category, type Service, type NearbyMerchant } from '../../lib/marketplace';
import { getImageUrl } from '../../lib/api';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, any> = {
    'cleaning': Sparkles,
    'plumbing': Zap,
    'electrical': Zap,
    'painting': Sparkles,
    'ac-repair': Zap,
    'carpentry': Zap,
    'pest-control': Filter,
    'appliance-repair': SlidersHorizontal,
};

type SortByOption = 'name' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { value: SortByOption; label: string; icon: any }[] = [
    { value: 'name', label: 'ALPHABETICAL', icon: SlidersHorizontal },
    { value: 'price_asc', label: 'PRICE: LOW', icon: Zap },
    { value: 'price_desc', label: 'PRICE: HIGH', icon: Zap },
    { value: 'rating', label: 'RATING', icon: Star },
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

    const scrollY = useSharedValue(0);

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

    const toggleView = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setViewMode(prev => prev === 'list' ? 'map' : 'list');
    };

    const renderCategoryChip = ({ item }: { item: Category }) => {
        const isActive = selectedCategory === item.id;
        const Icon = CATEGORY_ICONS[item.slug] || Sparkles;

        return (
            <Pressable
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => {
                    setSelectedCategory(isActive ? null : item.id);
                    Haptics.selectionAsync();
                }}
            >
                <Icon size={16} color={isActive ? '#fff' : '#64748B'} strokeWidth={2.5} />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {item.name.toUpperCase()}
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
            <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
                <Pressable
                    style={styles.serviceCard}
                    onPress={() => router.push(`/(customer)/service/${item.slug}`)}
                >
                    <View style={styles.cardImageContainer}>
                        {item.imageUrl ? (
                            <Image source={{ uri: getImageUrl(item.imageUrl) || '' }} style={styles.cardImage} />
                        ) : (
                            <View style={styles.cardImagePlaceholder}>
                                <Sparkles size={32} color={Colors.primary} strokeWidth={1.5} />
                            </View>
                        )}
                        <View style={styles.floatingPrice}>
                            <Text style={styles.priceLabel}>FROM</Text>
                            <Text style={styles.priceValue}>₹{minPrice}</Text>
                        </View>
                    </View>

                    <View style={styles.cardInfo}>
                        <View style={styles.titleRow}>
                            <Text style={styles.serviceTitle} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                            {avgRating > 0 && (
                                <View style={styles.ratingRow}>
                                    <Star size={12} color={Colors.primary} fill={Colors.primary} />
                                    <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>

                        <View style={styles.cardFooter}>
                            <Text style={styles.providerCount}>{merchantCount} EXPERTS NEARBY</Text>
                            <View style={styles.goBtn}>
                                <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Standardized Header */}
            <View style={[styles.stickyHeader, { paddingTop: insets.top, backgroundColor: '#FFF' }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>DISCOVER</Text>
                    <View style={styles.headerActions}>
                        <Pressable
                            style={[styles.actionBtn, showFilter && styles.actionBtnActive]}
                            onPress={() => setShowFilter(true)}
                        >
                            <SlidersHorizontal size={20} color={showFilter ? "#FFF" : "#111"} strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>

                {/* Simplified Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={18} color="#AAAAAA" strokeWidth={2.5} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for services..."
                            placeholderTextColor="#AAAAAA"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <Pressable onPress={() => setSearch('')}>
                                <X size={16} color="#AAAAAA" strokeWidth={2.5} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Categories Scroller */}
                <View style={styles.categoryScrollerWrap}>
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryChip}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}
                    />
                </View>
            </View>

            {viewMode === 'map' ? (
                <View style={styles.mapWrap}>
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
                            <Marker coordinate={{ latitude: user.latitude, longitude: user.longitude }}>
                                <View style={styles.userMarker}>
                                    <View style={styles.userMarkerPulse} />
                                    <View style={styles.userMarkerDot} />
                                </View>
                            </Marker>
                        )}
                        {merchants.map((merchant) => (
                            <Marker
                                key={merchant.id}
                                coordinate={{ latitude: merchant.latitude!, longitude: merchant.longitude! }}
                            >
                                <View style={styles.expertMarker}>
                                    <LinearGradient colors={[Colors.primary, '#FF7A00']} style={styles.markerGradient}>
                                        <Sparkles size={14} color="#FFF" strokeWidth={2.5} />
                                    </LinearGradient>
                                </View>
                                <Callout onPress={() => router.push({ pathname: '/(customer)/merchant/[id]', params: { id: merchant.id } })}>
                                    <View style={styles.calloutBox}>
                                        <Text style={styles.calloutTitle}>{merchant.businessName.toUpperCase()}</Text>
                                        <View style={styles.calloutRow}>
                                            <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={styles.calloutText}>{merchant.rating.toFixed(1)} · {merchant.distance.toFixed(1)}km</Text>
                                        </View>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                </View>
            ) : (
                <FlatList
                    data={isLoading ? [] : services}
                    renderItem={renderServiceCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingTop: insets.top + 230, paddingBottom: 120 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    refreshing={isLoading && services.length > 0}
                    onRefresh={() => fetchServices(1, false)}
                    ListEmptyComponent={() => !isLoading && (
                        <Animated.View entering={FadeInDown} style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Search size={48} color="#CBD5E1" strokeWidth={1} />
                            </View>
                            <Text style={styles.emptyText}>NO RESULTS FOUND</Text>
                            <Text style={styles.emptySubText}>Adjust your filters or service query for broader results.</Text>
                        </Animated.View>
                    )}
                />
            )}

            {/* View Mode Toggle */}
            <Animated.View entering={FadeInUp} style={[styles.viewToggleWrap, { bottom: insets.bottom + 100 }]}>
                <Pressable onPress={toggleView} style={styles.viewToggleBtn}>
                    <BlurView intensity={80} tint="dark" style={styles.viewToggleBlur}>
                        {viewMode === 'list' ? (
                            <><MapIcon size={20} color="#FFF" strokeWidth={2.5} /><Text style={styles.viewToggleText}>MAP</Text></>
                        ) : (
                            <><LayoutList size={20} color="#FFF" strokeWidth={2.5} /><Text style={styles.viewToggleText}>LIST</Text></>
                        )}
                    </BlurView>
                </Pressable>
            </Animated.View>

            {/* Filter Modal */}
            <Modal visible={showFilter} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.filterContent}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>FILTERS</Text>
                                <Text style={styles.modalSubtitle}>Refine your search results</Text>
                            </View>
                            <Pressable onPress={() => setShowFilter(false)} style={styles.modalClose}>
                                <X size={20} color="#111" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <Text style={styles.filterLabel}>SORT BY</Text>
                        {SORT_OPTIONS.map(opt => {
                            const isActive = sortBy === opt.value;
                            return (
                                <Pressable
                                    key={opt.value}
                                    style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                    onPress={() => { setSortBy(opt.value); setShowFilter(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                >
                                    <opt.icon size={18} color={isActive ? Colors.primary : "#64748B"} strokeWidth={2.5} />
                                    <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{opt.label}</Text>
                                    {isActive && <Check size={18} color={Colors.primary} strokeWidth={3} />}
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
    container: { flex: 1, backgroundColor: '#FFF' },

    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, height: 70 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    searchContainer: { paddingHorizontal: 25, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 55, borderRadius: 16, paddingHorizontal: 15, gap: 12, borderWidth: 1, borderColor: '#EEEEEE' },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111' },
    actionBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEEEEE' },
    actionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

    categoryScrollerWrap: { height: 60, marginBottom: 10 },
    categoryList: { paddingHorizontal: 25, gap: 8, alignItems: 'center' },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
    categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 0.5 },
    chipTextActive: { color: '#FFF' },

    listContent: { paddingHorizontal: 25 },

    // Service Cards
    serviceCard: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EEEEEE' },
    cardImageContainer: { height: 160, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    floatingPrice: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    priceLabel: { fontSize: 8, fontWeight: '800', color: '#AAA', letterSpacing: 0.5, marginBottom: -2 },
    priceValue: { fontSize: 13, fontWeight: '900', color: Colors.primary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 13, fontWeight: '800', color: '#111' },

    cardInfo: { padding: 16, paddingTop: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    serviceTitle: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.3, flex: 1 },
    serviceDescription: { fontSize: 12, color: '#AAAAAA', fontWeight: '500', lineHeight: 16, marginBottom: 15 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    providerStack: { flexDirection: 'row', alignItems: 'center' },
    avatarMini: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#FFF', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { fontSize: 10, fontWeight: '900', color: Colors.primary },
    providerCount: { fontSize: 10, fontWeight: '800', color: '#DDD', letterSpacing: 0.5 },
    goBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

    // Map
    mapWrap: { flex: 1 },
    userMarker: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    userMarkerPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '20' },
    userMarkerDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#FFF' },
    expertMarker: { width: 40, height: 40, padding: 3, backgroundColor: '#FFF', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    markerGradient: { flex: 1, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    calloutBox: { padding: 10, minWidth: 140 },
    calloutTitle: { fontSize: 12, fontWeight: '800', color: '#111', letterSpacing: 0.5, marginBottom: 4 },
    calloutRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    calloutText: { fontSize: 11, fontWeight: '700', color: '#AAA' },

    // Toggle
    viewToggleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
    viewToggleBtn: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#111' },
    viewToggleBlur: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
    viewToggleText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    filterContent: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 40, paddingHorizontal: 25 },
    modalDragHandle: { width: 40, height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 10 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
    modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#AAA' },
    modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    filterLabel: { fontSize: 10, fontWeight: '800', color: '#DDD', letterSpacing: 1.5, marginBottom: 12, marginLeft: 5, marginTop: 10 },
    filterOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
    filterOptionActive: { borderBottomColor: Colors.primary + '20' },
    filterOptionText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#AAA' },
    filterOptionTextActive: { color: '#111' },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyIconBox: { width: 90, height: 90, borderRadius: 32, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 13, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    emptySubText: { fontSize: 12, color: '#CCC', fontWeight: '500', marginTop: 6, textAlign: 'center' },
});
