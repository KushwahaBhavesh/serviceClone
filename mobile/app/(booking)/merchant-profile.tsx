import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    Dimensions,
    Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { catalogApi, type MerchantProfileData } from '../../lib/marketplace';
import { getImageUrl } from '../../lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

export default function MerchantProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [merchant, setMerchant] = useState<MerchantProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await catalogApi.getMerchantProfile(id);
                setMerchant(res.data.merchant);
            } catch (err: any) {
                console.error('Failed to load merchant profile:', err);
                setError('Could not load provider details');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading provider...</Text>
            </View>
        );
    }

    if (error || !merchant) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.errorText}>{error || 'Provider not found'}</Text>
                <Pressable style={styles.retryBtn} onPress={() => router.back()}>
                    <Text style={styles.retryBtnText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const coverUri = getImageUrl(merchant.coverImageUrl);
    const logoUri = getImageUrl(merchant.logoUrl);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* ─── Hero Section ─── */}
                <View style={styles.heroContainer}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.coverImage} />
                    ) : (
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight, '#FF9E4A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.coverImage}
                        />
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.65)']}
                        style={styles.heroOverlay}
                    />
                    <SafeAreaView style={styles.heroNav}>
                        <Pressable style={styles.navBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </Pressable>
                        <Pressable
                            style={styles.navBtn}
                            onPress={() => {
                                if (merchant.phone) Linking.openURL(`tel:${merchant.phone}`);
                            }}
                        >
                            <Ionicons name="call-outline" size={20} color="white" />
                        </Pressable>
                    </SafeAreaView>

                    {/* Logo + Name */}
                    <View style={styles.heroInfo}>
                        <View style={styles.logoContainer}>
                            {logoUri ? (
                                <Image source={{ uri: logoUri }} style={styles.logo} />
                            ) : (
                                <View style={[styles.logo, styles.logoPlaceholder]}>
                                    <Ionicons name="storefront" size={28} color={Colors.textMuted} />
                                </View>
                            )}
                            {merchant.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                                </View>
                            )}
                        </View>
                        <View style={styles.heroTextBlock}>
                            <Text style={styles.heroName} numberOfLines={2}>
                                {merchant.businessName}
                            </Text>
                            {merchant.businessCategory && (
                                <Text style={styles.heroCategory}>{merchant.businessCategory}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* ─── Quick Stats ─── */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={18} color="#FFB800" />
                        <Text style={styles.statValue}>{merchant.rating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.secondary} />
                        <Text style={styles.statValue}>{merchant.totalReviews}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="construct-outline" size={18} color={Colors.primary} />
                        <Text style={styles.statValue}>{merchant.services.length}</Text>
                        <Text style={styles.statLabel}>Services</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="navigate-outline" size={18} color={Colors.success} />
                        <Text style={styles.statValue}>{merchant.serviceRadius}</Text>
                        <Text style={styles.statLabel}>km range</Text>
                    </View>
                </View>

                {/* ─── About Section ─── */}
                {merchant.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.aboutText}>{merchant.description}</Text>
                    </View>
                )}

                {/* Location */}
                {(merchant.city || merchant.address) && (
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={18} color={Colors.primary} />
                        <Text style={styles.locationText}>
                            {[merchant.address, merchant.city, merchant.state].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                )}

                {/* ─── Services Catalog ─── */}
                {merchant.services.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Services Offered</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.servicesScroll}
                            decelerationRate="fast"
                            snapToInterval={CARD_WIDTH + Spacing.md}
                        >
                            {merchant.services.map((svc) => (
                                <Pressable
                                    key={svc.merchantServiceId}
                                    style={styles.serviceCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(booking)/[slug]',
                                            params: { slug: svc.slug },
                                        })
                                    }
                                >
                                    {svc.imageUrl ? (
                                        <Image
                                            source={{ uri: getImageUrl(svc.imageUrl) || '' }}
                                            style={styles.serviceCardImage}
                                        />
                                    ) : (
                                        <View style={[styles.serviceCardImage, styles.serviceCardPlaceholder]}>
                                            <Ionicons name="construct" size={32} color={Colors.textMuted} />
                                        </View>
                                    )}
                                    <View style={styles.serviceCardBody}>
                                        {svc.category && (
                                            <Text style={styles.serviceCardCategory}>{svc.category.name}</Text>
                                        )}
                                        <Text style={styles.serviceCardName} numberOfLines={1}>
                                            {svc.name}
                                        </Text>
                                        <View style={styles.serviceCardMeta}>
                                            <Text style={styles.serviceCardPrice}>₹{svc.price}</Text>
                                            <Text style={styles.serviceCardDuration}>
                                                <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                                                {' '}{svc.duration} min
                                            </Text>
                                        </View>
                                        <Pressable
                                            style={styles.serviceBookBtn}
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/(booking)/checkout',
                                                    params: {
                                                        serviceId: svc.id,
                                                        serviceName: svc.name,
                                                        price: String(svc.price),
                                                        qty: '1',
                                                    },
                                                })
                                            }
                                        >
                                            <Text style={styles.serviceBookBtnText}>Book Now</Text>
                                            <Ionicons name="arrow-forward" size={14} color="white" />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ─── Reviews Section ─── */}
                {merchant.reviews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Customer Reviews</Text>
                            <View style={styles.ratingOverview}>
                                <Ionicons name="star" size={16} color="#FFB800" />
                                <Text style={styles.ratingOverviewText}>
                                    {merchant.rating.toFixed(1)} ({merchant.totalReviews})
                                </Text>
                            </View>
                        </View>
                        {merchant.reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerInfo}>
                                        {review.user.avatarUrl ? (
                                            <Image
                                                source={{ uri: getImageUrl(review.user.avatarUrl) || '' }}
                                                style={styles.reviewerAvatar}
                                            />
                                        ) : (
                                            <View style={[styles.reviewerAvatar, styles.avatarPlaceholder]}>
                                                <Ionicons name="person" size={14} color={Colors.textMuted} />
                                            </View>
                                        )}
                                        <View>
                                            <Text style={styles.reviewerName}>
                                                {review.user.name || 'Customer'}
                                            </Text>
                                            <Text style={styles.reviewDate}>
                                                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((i) => (
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

                {/* Bottom spacer to prevent sticky CTA from covering content */}
                <View style={{ height: 160 }} />
            </ScrollView>

            {/* ─── Sticky Bottom CTA ─── */}
            {merchant.services.length > 0 && (
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomLabel}>
                            {merchant.services.length} service{merchant.services.length > 1 ? 's' : ''} available
                        </Text>
                        <Text style={styles.bottomPrice}>
                            From ₹{Math.min(...merchant.services.map((s) => s.price))}
                        </Text>
                    </View>
                    <Pressable
                        style={styles.bottomCta}
                        onPress={() =>
                            router.push({
                                pathname: '/(booking)/[slug]',
                                params: { slug: merchant.services[0].slug },
                            })
                        }
                    >
                        <Text style={styles.bottomCtaText}>Browse Services</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: Colors.background, gap: Spacing.md,
    },
    loadingText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
    errorText: { fontSize: FontSize.md, color: Colors.textMuted },
    retryBtn: {
        marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    },
    retryBtnText: { color: 'white', fontWeight: '700', fontSize: FontSize.sm },
    scrollContent: { paddingBottom: 0 },

    // ─── Hero ───
    heroContainer: { position: 'relative', height: 280 },
    coverImage: { width: '100%', height: 280 },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroNav: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingTop: Spacing.xs,
    },
    navBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
    },
    heroInfo: {
        position: 'absolute', bottom: Spacing.lg, left: Spacing.lg, right: Spacing.lg,
        flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md,
    },
    logoContainer: { position: 'relative' },
    logo: {
        width: 64, height: 64, borderRadius: 18,
        borderWidth: 3, borderColor: 'white',
    },
    logoPlaceholder: {
        backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute', bottom: -4, right: -4,
        backgroundColor: 'white', borderRadius: 12, padding: 1,
    },
    heroTextBlock: { flex: 1 },
    heroName: { fontSize: FontSize.xxl, fontWeight: '800', color: 'white' },
    heroCategory: {
        fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2,
    },

    // ─── Stats ───
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginHorizontal: Spacing.lg, marginTop: -Spacing.lg,
        backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
        padding: Spacing.md, paddingVertical: Spacing.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
    statDivider: { width: 1, height: 36, backgroundColor: Colors.border },

    // ─── Section ───
    section: {
        marginTop: Spacing.xl, paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md,
    },
    aboutText: {
        fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24,
    },
    locationRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginTop: Spacing.md, paddingHorizontal: Spacing.lg,
    },
    locationText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },

    // ─── Services Scroll ───
    servicesScroll: { paddingRight: Spacing.lg },
    serviceCard: {
        width: CARD_WIDTH,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        marginRight: Spacing.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        overflow: 'hidden',
    },
    serviceCardImage: {
        width: '100%', height: 130, backgroundColor: Colors.backgroundAlt,
    },
    serviceCardPlaceholder: {
        justifyContent: 'center', alignItems: 'center',
    },
    serviceCardBody: { padding: Spacing.md },
    serviceCardCategory: {
        fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary,
        backgroundColor: Colors.primary + '12', paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: 6,
    },
    serviceCardName: {
        fontSize: FontSize.md, fontWeight: '700', color: Colors.text,
    },
    serviceCardMeta: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: Spacing.sm,
    },
    serviceCardPrice: {
        fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary,
    },
    serviceCardDuration: {
        fontSize: FontSize.xs, color: Colors.textMuted,
    },
    serviceBookBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
        paddingVertical: Spacing.sm + 2, marginTop: Spacing.md,
    },
    serviceBookBtnText: {
        fontSize: FontSize.sm, fontWeight: '700', color: 'white',
    },

    // ─── Reviews ───
    ratingOverview: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    ratingOverviewText: {
        fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary,
    },
    reviewCard: {
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
    },
    reviewHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    reviewerAvatar: { width: 36, height: 36, borderRadius: 18 },
    avatarPlaceholder: {
        backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center',
    },
    reviewerName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    reviewDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewComment: {
        fontSize: FontSize.sm, color: Colors.textSecondary,
        marginTop: Spacing.sm, lineHeight: 20,
    },

    // ─── Bottom Bar ───
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        paddingBottom: Spacing.xl + 10,
        backgroundColor: Colors.surface,
        borderTopWidth: 1, borderTopColor: Colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 8,
    },
    bottomLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
    bottomPrice: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    bottomCta: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
    },
    bottomCtaText: { fontSize: FontSize.md, fontWeight: '700', color: 'white' },
});
