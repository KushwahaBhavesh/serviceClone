import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    ChevronRight,
    Star,
    Timer,
    Sparkles,
    Store,
    ShieldCheck,
    Plus,
    Minus,
    ArrowRight
} from 'lucide-react-native';
import { Colors } from '../../../constants/theme';
import { catalogApi, type Service } from '../../../lib/marketplace';
import { getImageUrl } from '../../../lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface MerchantOffer {
    id: string;
    price: number;
    isActive: boolean;
    merchant: {
        id: string;
        businessName: string;
        rating: number;
        totalReviews: number;
        isVerified: boolean;
        logoUrl: string | null;
        city: string | null;
    };
}

interface ServiceReview {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { name: string | null; avatarUrl: string | null };
}

export default function ServiceDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [service, setService] = useState<Service & { merchantServices?: MerchantOffer[] } | null>(null);
    const [reviews, setReviews] = useState<ServiceReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);

    useEffect(() => {
        if (!slug) return;
        const fetchData = async () => {
            try {
                const [serviceRes, reviewsRes] = await Promise.all([
                    catalogApi.getServiceBySlug(slug),
                    catalogApi.getServiceReviews(slug, { limit: 5 }),
                ]);
                setService(serviceRes.data.service);
                setReviews(reviewsRes.data.reviews);
            } catch (err) {
                console.error('Failed to load service:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    const bestPrice = useMemo(() => {
        if (!service?.merchantServices?.length) return service?.basePrice || 0;
        return Math.min(...service.merchantServices.map(ms => ms.price));
    }, [service]);

    const avgRating = useMemo(() => {
        if (!reviews.length) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }, [reviews]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.errorText}>Service not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" translucent />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {service.imageUrl ? (
                        <Image source={{ uri: getImageUrl(service.imageUrl) || '' }} style={styles.heroImage} />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Sparkles size={64} color="#DDD" strokeWidth={1} />
                        </View>
                    )}
                    <Pressable
                        style={[styles.backButton, { top: insets.top + 10 }]}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={22} color="#111" strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Service Info */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.serviceName}>{service.name.toUpperCase()}</Text>
                        {avgRating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Star size={14} color={Colors.primary} fill={Colors.primary} />
                                <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                    {service.category && (
                        <Text style={styles.categoryTag}>{service.category.name}</Text>
                    )}
                    {service.description && (
                        <Text style={styles.description}>{service.description}</Text>
                    )}

                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Timer size={18} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.statText}>{service.duration} MINS</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Sparkles size={18} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.statText}>FROM ₹{bestPrice}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Store size={18} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.statText}>
                                {service.merchantServices?.length || 0} EXPERTS
                            </Text>
                        </View>
                    </View>

                    {/* Quantity */}
                    <View style={styles.qtySection}>
                        <Text style={styles.sectionTitle}>QUANTITY</Text>
                        <View style={styles.qtyControl}>
                            <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(Math.max(1, qty - 1))}
                            >
                                <Minus size={20} color="#111" />
                            </Pressable>
                            <Text style={styles.qtyValue}>{qty}</Text>
                            <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(qty + 1)}
                            >
                                <Plus size={20} color="#111" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Merchant Offers - Refined "Short Cards" */}
                    {service.merchantServices && service.merchantServices.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>AVAILABLE PROVIDERS</Text>
                            {service.merchantServices.map((ms) => (
                                <Pressable
                                    key={ms.id}
                                    style={styles.merchantCard}
                                    onPress={() => router.push(`/(customer)/merchant/${ms.merchant.id}`)}
                                >
                                    <View style={styles.merchantHeader}>
                                        <View style={styles.merchantVisual}>
                                            {ms.merchant.logoUrl ? (
                                                <Image
                                                    source={{ uri: getImageUrl(ms.merchant.logoUrl) || '' }}
                                                    style={styles.merchantLogo}
                                                />
                                            ) : (
                                                <View style={styles.logoPlaceholder}>
                                                    <Store size={18} color="#AAA" />
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.merchantIdentify}>
                                            <View style={styles.merchantNameRow}>
                                                <Text style={styles.merchantName} numberOfLines={1}>
                                                    {ms.merchant.businessName.toUpperCase()}
                                                </Text>
                                                {ms.merchant.isVerified && (
                                                    <ShieldCheck size={14} color={Colors.primary} strokeWidth={3} />
                                                )}
                                            </View>
                                            <View style={styles.merchantMeta}>
                                                <Star size={10} color={Colors.primary} fill={Colors.primary} />
                                                <Text style={styles.merchantRating}>
                                                    {ms.merchant.rating.toFixed(1)} ({ms.merchant.totalReviews})
                                                </Text>
                                                {ms.merchant.city && (
                                                    <Text style={styles.merchantCity}>· {ms.merchant.city}</Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.priceAction}>
                                            <Text style={styles.merchantPrice}>₹{ms.price}</Text>
                                            <ChevronRight size={16} color="#DDD" strokeWidth={2.5} />
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Reviews */}
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>CUSTOMER REVIEWS</Text>
                            {reviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewerInfo}>
                                            {review.user.avatarUrl ? (
                                                <Image source={{ uri: review.user.avatarUrl }} style={styles.reviewerAvatar} />
                                            ) : (
                                                <View style={[styles.reviewerAvatar, styles.avatarPlaceholder]}>
                                                    <Store size={14} color="#AAA" />
                                                </View>
                                            )}
                                            <Text style={styles.reviewerName}>{review.user.name || 'Customer'}</Text>
                                        </View>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    color={i <= review.rating ? Colors.primary : "#DDD"}
                                                    fill={i <= review.rating ? Colors.primary : "transparent"}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    {review.comment && (
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Spacer for bottom bar */}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Bar - White & Orange */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>TOTAL ESTIMATE</Text>
                    <Text style={styles.priceValue}>₹{bestPrice * qty}</Text>
                </View>
                <Pressable
                    style={styles.bookBtn}
                    onPress={() =>
                        router.push({
                            pathname: '/(booking)/checkout',
                            params: {
                                serviceId: service?.id || '',
                                serviceName: service?.name || '',
                                price: String(bestPrice),
                                qty: String(qty),
                            },
                        })
                    }
                >
                    <Text style={styles.bookBtnText}>BOOK NOW</Text>
                    <ArrowRight size={18} color="white" strokeWidth={3} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    errorText: { fontSize: 16, color: '#AAA', fontWeight: '800' },
    scroll: { paddingBottom: 0 },

    // Hero
    heroContainer: { position: 'relative' },
    heroImage: { width: '100%', height: 260, backgroundColor: '#FAFAFA' },
    heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    backButton: {
        position: 'absolute', left: 20,
        width: 45, height: 45, borderRadius: 18,
        backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    },

    // Content
    content: { paddingHorizontal: 25, paddingTop: 25 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    serviceName: { fontSize: 22, fontWeight: '800', color: '#111', flex: 1, letterSpacing: -0.5 },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0'
    },
    ratingText: { fontSize: 13, fontWeight: '800', color: '#111' },
    categoryTag: {
        fontSize: 10, fontWeight: '800', color: Colors.primary,
        backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, alignSelf: 'flex-start', letterSpacing: 0.5
    },
    description: { fontSize: 14, color: '#AAAAAA', fontWeight: '500', lineHeight: 22, marginTop: 15 },

    // Stats
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#FAFAFA', marginTop: 25
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statText: { fontSize: 11, fontWeight: '800', color: '#DDD', letterSpacing: 0.5 },

    // Quantity
    qtySection: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, paddingVertical: 10
    },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    qtyBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center',
    },
    qtyValue: { fontSize: 18, fontWeight: '800', color: '#111', minWidth: 24, textAlign: 'center' },

    // Sections
    section: { marginTop: 30 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#DDD', letterSpacing: 1.5, marginBottom: 15 },

    // Merchant Cards (Refined short format)
    merchantCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 12,
        borderWidth: 1, borderColor: '#EEEEEE'
    },
    merchantHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    merchantVisual: { width: 50, height: 50, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FAFAFA' },
    merchantLogo: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    merchantIdentify: { flex: 1 },
    merchantNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    merchantName: { fontSize: 13, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
    merchantMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    merchantRating: { fontSize: 12, fontWeight: '800', color: '#111' },
    merchantCity: { fontSize: 12, color: '#AAAAAA', fontWeight: '500' },
    priceAction: { alignItems: 'flex-end', gap: 4 },
    merchantPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },

    // Reviews
    reviewCard: {
        backgroundColor: '#FAFAFA', borderRadius: 16, padding: 15, marginBottom: 10,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewerAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F0F0F0' },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    reviewerName: { fontSize: 12, fontWeight: '800', color: '#111' },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 13, color: '#AAAAAA', fontWeight: '500', marginTop: 10, lineHeight: 18 },

    // Bottom Bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 25, paddingVertical: 15,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    priceContainer: {},
    priceLabel: { fontSize: 9, fontWeight: '800', color: '#DDD', letterSpacing: 1 },
    priceValue: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -1 },
    bookBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 15,
        borderRadius: 16,
    },
    bookBtnText: { fontSize: 14, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
});
