import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Linking, Platform, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInUp,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import {
    ArrowLeft,
    Share2,
    Star,
    ShieldCheck,
    MapPin,
    Clock,
    ChevronRight,
    MessageSquare,
    Zap,
    Navigation2,
    Heart,
    Store
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../../constants/theme';
import { catalogApi, customerApi, type MerchantProfileData } from '../../../lib/marketplace';
import { getImageUrl } from '../../../lib/api';
import { isFavorite, toggleFavorite } from '../../../lib/storage';

export default function MerchantDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [merchant, setMerchant] = useState<MerchantProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFav, setIsFav] = useState(false);
    const [activeTab, setActiveTab] = useState<'SERVICES' | 'REVIEWS' | 'ABOUT'>('SERVICES');

    const scrollY = useSharedValue(0);

    const checkFavorite = useCallback(async () => {
        if (!id) return;
        const fav = await isFavorite(id);
        setIsFav(fav);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        checkFavorite();
        (async () => {
            try {
                const res = await catalogApi.getMerchantProfile(id);
                setMerchant(res.data.merchant);
            } catch (err: any) {
                setError('COULD NOT RESOLVE MERCHANT DATA');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, checkFavorite]);

    const handleToggleFavorite = async () => {
        if (!id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newState = await toggleFavorite(id);
        setIsFav(newState);
    };

    const handleShare = async () => {
        if (!merchant) return;
        try {
            await Share.share({
                message: `Check out ${merchant.businessName} on our App!`,
                url: Platform.OS === 'ios' ? `oracle://merchant/${id}` : undefined,
            });
        } catch (error) {
            console.error('Sharing failed:', error);
        }
    };

    const headerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [0, 200], [0, 1], Extrapolate.CLAMP),
        };
    });

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error || !merchant) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={() => router.back()}>
                    <Text style={styles.retryText}>GO BACK</Text>
                </Pressable>
            </View>
        );
    }

    const coverUri = getImageUrl(merchant.coverImageUrl);
    const logoUri = getImageUrl(merchant.logoUrl);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Sticky Header (Animated) */}
            <Animated.View style={[styles.stickyHeader, { height: insets.top + 60 }, headerStyle]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF' }]} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{merchant.businessName.toUpperCase()}</Text>
                </View>
            </Animated.View>

            {/* Top Navigation Overlay */}
            <View style={[styles.topActions, { top: insets.top + 10 }]}>
                <Pressable
                    style={styles.actionCircle}
                    onPress={() => router.back()}
                >
                    <View style={styles.actionBlur}>
                        <ArrowLeft size={20} color="#FFF" strokeWidth={3} />
                    </View>
                </Pressable>

                <View style={styles.rightActions}>
                    <Pressable style={styles.actionCircle} onPress={handleShare}>
                        <View style={styles.actionBlur}>
                            <Share2 size={18} color="#FFF" strokeWidth={2.5} />
                        </View>
                    </Pressable>
                    <Pressable style={styles.actionCircle} onPress={handleToggleFavorite}>
                        <View style={styles.actionBlur}>
                            <Heart size={18} color={isFav ? Colors.primary : "#FFF"} fill={isFav ? Colors.primary : "transparent"} strokeWidth={2.5} />
                        </View>
                    </Pressable>
                </View>
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
                bounces={false}
            >
                {/* Immersive Hero Section */}
                <View style={styles.hero}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.heroImg} />
                    ) : (
                        <View style={[styles.heroImg, { backgroundColor: '#FAFAFA' }]} />
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay} />

                    <View style={styles.heroInfo}>
                        <Animated.View entering={FadeInRight} style={styles.logoWrap}>
                            {logoUri ? (
                                <Image source={{ uri: logoUri }} style={styles.logo} />
                            ) : (
                                <View style={styles.logoPlaceholder}><Store size={24} color={Colors.primary} /></View>
                            )}
                            {merchant.isVerified && (
                                <View style={styles.verifyBadge}><ShieldCheck size={14} color={Colors.primary} fill="white" strokeWidth={3} /></View>
                            )}
                        </Animated.View>

                        <View style={styles.heroText}>
                            <Text style={styles.merchantName}>{merchant.businessName.toUpperCase()}</Text>
                            <View style={styles.categoryRow}>
                                <Text style={styles.categoryText}>{merchant.businessCategory?.toUpperCase() || 'EXPERT'}</Text>
                                <View style={styles.dot} />
                                <View style={styles.ratingInline}>
                                    <Star size={12} color={Colors.primary} fill={Colors.primary} />
                                    <Text style={styles.ratingText}>{merchant.rating.toFixed(1)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsBento}>
                        <View style={styles.statBox}>
                            <Store size={20} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.statValue}>{merchant.services.length}</Text>
                            <Text style={styles.statLabel}>OFFERINGS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Star size={20} color={Colors.primary} fill={Colors.primary} strokeWidth={1} />
                            <Text style={styles.statValue}>{merchant.totalReviews}</Text>
                            <Text style={styles.statLabel}>REVIEWS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <MapPin size={20} color={Colors.primary} strokeWidth={2.5} />
                            <Text style={styles.statValue}>{merchant.serviceRadius}KM</Text>
                            <Text style={styles.statLabel}>RANGE</Text>
                        </View>
                    </View>
                </View>

                {/* Navigation Tabs */}
                <View style={styles.tabsContainer}>
                    {['SERVICES', 'REVIEWS', 'ABOUT'].map((tab) => (
                        <Pressable
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => {
                                setActiveTab(tab as any);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.content}>
                    {activeTab === 'SERVICES' && (
                        <Animated.View entering={FadeInUp} style={styles.tabContent}>
                            {merchant.services.length > 0 ? (
                                merchant.services.map((svc, idx) => (
                                    <Pressable
                                        key={idx}
                                        style={styles.serviceItem}
                                        onPress={() => router.push({
                                            pathname: '/(booking)/checkout',
                                            params: {
                                                serviceId: svc.id,
                                                serviceName: svc.name,
                                                price: String(svc.price),
                                                qty: '1'
                                            }
                                        })}
                                    >
                                        <View style={styles.svcMeta}>
                                            <Text style={styles.svcName}>{svc.name.toUpperCase()}</Text>
                                            <Text style={svc.description ? styles.svcDesc : { height: 0 }} numberOfLines={2}>{svc.description}</Text>
                                            <View style={styles.svcFooter}>
                                                <Text style={styles.svcPrice}>₹{svc.price}</Text>
                                                <View style={styles.durationTag}>
                                                    <Clock size={12} color="#AAA" />
                                                    <Text style={styles.durationText}>{svc.duration} MIN</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.svcAddBtn}>
                                            <Zap size={16} color={Colors.primary} fill={Colors.primary} />
                                        </View>
                                    </Pressable>
                                ))
                            ) : (
                                <View style={styles.emptyContent}>
                                    <Zap size={40} color="#DDD" />
                                    <Text style={styles.emptyText}>NO SERVICES AVAILABLE</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'REVIEWS' && (
                        <Animated.View entering={FadeInUp} style={styles.tabContent}>
                            {merchant.reviews.length > 0 ? (
                                merchant.reviews.map((review, idx) => (
                                    <View key={idx} style={styles.reviewCard}>
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.avatarBox}>
                                                <Text style={styles.avatarChar}>{review.user.name?.[0]?.toUpperCase() || 'C'}</Text>
                                            </View>
                                            <View style={styles.reviewMain}>
                                                <View style={styles.userRow}>
                                                    <Text style={styles.userName}>{review.user.name?.toUpperCase() || 'ANONYMOUS'}</Text>
                                                    <View style={styles.starsRow}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} color={i < review.rating ? Colors.primary : "#DDD"} fill={i < review.rating ? Colors.primary : "transparent"} />
                                                        ))}
                                                    </View>
                                                </View>
                                                <Text style={styles.reviewDate}>
                                                    {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        {review.comment && <Text style={styles.commentText}>{review.comment}</Text>}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyContent}>
                                    <MessageSquare size={40} color="#DDD" />
                                    <Text style={styles.emptyText}>NO REVIEWS FOUND</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'ABOUT' && (
                        <Animated.View entering={FadeInUp} style={styles.tabContent}>
                            <View style={styles.aboutCard}>
                                <Text style={styles.aboutTitle}>ABOUT THE MERCHANT</Text>
                                <Text style={styles.aboutDesc}>{merchant.description || 'No description provided.'}</Text>

                                <View style={styles.locationDetail}>
                                    <View style={styles.locIcon}>
                                        <MapPin size={20} color={Colors.primary} strokeWidth={2.5} />
                                    </View>
                                    <View style={styles.locInfo}>
                                        <Text style={styles.locLabel}>LOCATION</Text>
                                        <Text style={styles.locText}>{[merchant.address, merchant.city, merchant.state].filter(Boolean).join(', ').toUpperCase()}</Text>
                                    </View>
                                </View>

                                {merchant.latitude && merchant.longitude && (
                                    <Pressable
                                        style={styles.mapBtn}
                                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${merchant.latitude},${merchant.longitude}`)}
                                    >
                                        <Navigation2 size={16} color="#FFF" />
                                        <Text style={styles.mapBtnText}>VIEW ON MAPS</Text>
                                    </Pressable>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    <View style={{ height: 140 }} />
                </View>
            </Animated.ScrollView>

            {/* Bottom Bar - White & Orange */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 15 }]}>
                <View style={styles.bottomBarContent}>
                    <Pressable
                        style={styles.chatBtn}
                        onPress={async () => {
                            if (!merchant.userId) return;
                            try {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const res = await customerApi.initDirectChat(merchant.userId);
                                router.push(`/(customer)/chat/${res.data.chat.id}`);
                            } catch (err) {
                                // Silent fail or toast
                            }
                        }}
                    >
                        <MessageSquare size={22} color="#111" />
                    </Pressable>
                    <Pressable
                        style={styles.mainCta}
                        onPress={() => {
                            if (merchant.services.length > 0) {
                                router.push({
                                    pathname: '/(booking)/checkout',
                                    params: {
                                        serviceId: merchant.services[0].id,
                                        serviceName: merchant.services[0].name,
                                        price: String(merchant.services[0].price),
                                        qty: '1'
                                    }
                                });
                            }
                        }}
                    >
                        <View style={styles.ctaButton}>
                            <Text style={styles.ctaText}>BOOK NOW</Text>
                            <ChevronRight size={18} color="#FFF" strokeWidth={3.5} />
                        </View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    errorText: { fontSize: 14, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    retryBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, backgroundColor: '#111', borderRadius: 16 },
    retryText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 80 },
    headerTitle: { fontSize: 12, fontWeight: '800', color: '#111', letterSpacing: 1 },

    topActions: { position: 'absolute', left: 20, right: 20, zIndex: 101, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rightActions: { flexDirection: 'row', gap: 10 },
    actionCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    actionBlur: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

    hero: { height: 400, position: 'relative', marginBottom: 20 },
    heroImg: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    heroInfo: { position: 'absolute', bottom: 40, left: 25, right: 25, flexDirection: 'row', alignItems: 'center', gap: 20 },
    logoWrap: { width: 84, height: 84, borderRadius: 30, backgroundColor: '#FFF', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    logo: { width: '100%', height: '100%', borderRadius: 26 },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    verifyBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 14, padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    heroText: { flex: 1 },
    merchantName: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    categoryText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
    ratingInline: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    ratingText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

    statsContainer: { paddingHorizontal: 20, marginTop: -50 },
    statsBento: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
    statBox: { flex: 1, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },

    tabsContainer: { flexDirection: 'row', paddingHorizontal: 25, marginTop: 30, gap: 10 },
    tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#FAFAFA' },
    activeTab: { backgroundColor: '#111' },
    tabText: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    activeTabText: { color: '#FFF' },

    content: { paddingVertical: 20 },
    tabContent: { paddingHorizontal: 25 },

    // Services Tab
    serviceItem: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 15 },
    svcMeta: { flex: 1 },
    svcName: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: -0.2, marginBottom: 4 },
    svcDesc: { fontSize: 12, color: '#AAA', lineHeight: 18, marginBottom: 12, fontWeight: '500' },
    svcFooter: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    svcPrice: { fontSize: 15, fontWeight: '800', color: '#111' },
    durationTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FAFAFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    durationText: { fontSize: 9, fontWeight: '800', color: '#AAA' },
    svcAddBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    // Reviews Tab
    reviewCard: { backgroundColor: '#FAFAFA', borderRadius: 20, padding: 20, marginBottom: 12 },
    reviewHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    avatarBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    avatarChar: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    reviewMain: { flex: 1 },
    userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userName: { fontSize: 12, fontWeight: '800', color: '#111' },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewDate: { fontSize: 9, fontWeight: '800', color: '#DDD', marginTop: 2, letterSpacing: 1 },
    commentText: { fontSize: 13, color: '#888', fontWeight: '500', lineHeight: 20 },

    // About Tab
    aboutCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#F0F0F0' },
    aboutTitle: { fontSize: 10, fontWeight: '800', color: '#DDD', letterSpacing: 2, marginBottom: 15 },
    aboutDesc: { fontSize: 14, color: '#888', lineHeight: 22, fontWeight: '500', marginBottom: 25 },
    locationDetail: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 25 },
    locIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    locInfo: { flex: 1 },
    locLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
    locText: { fontSize: 12, fontWeight: '800', color: '#111', marginTop: 2 },
    mapBtn: { height: 54, borderRadius: 18, backgroundColor: '#111', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    mapBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

    emptyContent: { alignItems: 'center', paddingVertical: 60, gap: 15 },
    emptyText: { fontSize: 11, fontWeight: '800', color: '#DDD', letterSpacing: 2 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    bottomBarContent: { flexDirection: 'row', padding: 15, gap: 10 },
    chatBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    mainCta: { flex: 1, height: 56, borderRadius: 18, overflow: 'hidden' },
    ctaButton: { flex: 1, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    ctaText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
});
