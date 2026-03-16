import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { catalogApi, type Service } from '../../lib/marketplace';

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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {service.imageUrl ? (
                        <Image source={{ uri: service.imageUrl }} style={styles.heroImage} />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Ionicons name="construct" size={64} color={Colors.textMuted} />
                        </View>
                    )}
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={Colors.text} />
                    </Pressable>
                </View>

                {/* Service Info */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {avgRating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={14} color="#FFB800" />
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
                            <Ionicons name="time-outline" size={18} color={Colors.primary} />
                            <Text style={styles.statText}>{service.duration} min</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                            <Text style={styles.statText}>From ₹{bestPrice}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
                            <Text style={styles.statText}>
                                {service.merchantServices?.length || 0} providers
                            </Text>
                        </View>
                    </View>

                    {/* Quantity */}
                    <View style={styles.qtySection}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.qtyControl}>
                            <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(Math.max(1, qty - 1))}
                            >
                                <Ionicons name="remove" size={20} color={Colors.text} />
                            </Pressable>
                            <Text style={styles.qtyValue}>{qty}</Text>
                            <Pressable
                                style={styles.qtyBtn}
                                onPress={() => setQty(qty + 1)}
                            >
                                <Ionicons name="add" size={20} color={Colors.text} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Merchant Offers */}
                    {service.merchantServices && service.merchantServices.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Available Providers</Text>
                            {service.merchantServices.map((ms) => (
                                <View key={ms.id} style={styles.merchantCard}>
                                    <View style={styles.merchantLeft}>
                                        {ms.merchant.logoUrl ? (
                                            <Image
                                                source={{ uri: ms.merchant.logoUrl }}
                                                style={styles.merchantLogo}
                                            />
                                        ) : (
                                            <View style={[styles.merchantLogo, styles.logoPlaceholder]}>
                                                <Ionicons name="storefront" size={20} color={Colors.textMuted} />
                                            </View>
                                        )}
                                        <View style={styles.merchantInfo}>
                                            <View style={styles.merchantNameRow}>
                                                <Text style={styles.merchantName} numberOfLines={1}>
                                                    {ms.merchant.businessName}
                                                </Text>
                                                {ms.merchant.isVerified && (
                                                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                                                )}
                                            </View>
                                            <View style={styles.merchantMeta}>
                                                <Ionicons name="star" size={12} color="#FFB800" />
                                                <Text style={styles.merchantRating}>
                                                    {ms.merchant.rating.toFixed(1)} ({ms.merchant.totalReviews})
                                                </Text>
                                                {ms.merchant.city && (
                                                    <Text style={styles.merchantCity}>· {ms.merchant.city}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.merchantPrice}>₹{ms.price}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Reviews */}
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Customer Reviews</Text>
                            {reviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewerInfo}>
                                            {review.user.avatarUrl ? (
                                                <Image source={{ uri: review.user.avatarUrl }} style={styles.reviewerAvatar} />
                                            ) : (
                                                <View style={[styles.reviewerAvatar, styles.avatarPlaceholder]}>
                                                    <Ionicons name="person" size={14} color={Colors.textMuted} />
                                                </View>
                                            )}
                                            <Text style={styles.reviewerName}>{review.user.name || 'Customer'}</Text>
                                        </View>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Ionicons
                                                    key={i}
                                                    name={i <= review.rating ? 'star' : 'star-outline'}
                                                    size={14}
                                                    color="#FFB800"
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

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Starting at</Text>
                    <Text style={styles.priceValue}>₹{bestPrice * qty}</Text>
                </View>
                <Pressable
                    style={styles.bookBtn}
                    onPress={() =>
                        router.push({
                            pathname: '/(booking)/checkout',
                            params: {
                                serviceId: service.id,
                                serviceName: service.name,
                                price: String(bestPrice),
                                qty: String(qty),
                            },
                        })
                    }
                >
                    <Text style={styles.bookBtnText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    errorText: { fontSize: FontSize.md, color: Colors.textMuted },
    scroll: { paddingBottom: 0 },
    // ─── Hero ───
    heroContainer: { position: 'relative' },
    heroImage: { width: '100%', height: 260, backgroundColor: Colors.backgroundAlt },
    heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    backButton: {
        position: 'absolute', top: 50, left: Spacing.md,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
    },
    // ─── Content ───
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, flex: 1 },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
    },
    ratingText: { fontSize: FontSize.sm, fontWeight: '700', color: '#F59E0B' },
    categoryTag: {
        fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary,
        backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginTop: Spacing.sm,
    },
    description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginTop: Spacing.md },
    // ─── Stats ───
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', gap: Spacing.md,
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginTop: Spacing.lg,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    // ─── Quantity ───
    qtySection: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl,
    },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    qtyBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
    },
    qtyValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, minWidth: 24, textAlign: 'center' },
    // ─── Sections ───
    section: { marginTop: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    // ─── Merchant Cards ───
    merchantCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
    },
    merchantLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    merchantLogo: { width: 44, height: 44, borderRadius: 22 },
    logoPlaceholder: { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    merchantInfo: { flex: 1 },
    merchantNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    merchantName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    merchantMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    merchantRating: { fontSize: FontSize.xs, color: Colors.textSecondary },
    merchantCity: { fontSize: FontSize.xs, color: Colors.textMuted },
    merchantPrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
    // ─── Reviews ───
    reviewCard: {
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    reviewerAvatar: { width: 32, height: 32, borderRadius: 16 },
    avatarPlaceholder: { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    reviewerName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },
    // ─── Bottom Bar ───
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl + 10,
        backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border,
    },
    priceContainer: {},
    priceLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
    priceValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    bookBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
    },
    bookBtnText: { fontSize: FontSize.md, fontWeight: '700', color: 'white' },
});
