import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, Pressable, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, Star, MessageCircle, Send, X, Hash,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import api from '../../lib/api';

const MERCHANT = '/api/v1/merchant';

interface Review {
    id: string; rating: number; comment: string | null;
    merchantReply: string | null; merchantReplyAt: string | null;
    createdAt: string;
    booking: { bookingNumber: string };
    user: { name: string | null; avatarUrl: string | null };
}

export default function ReviewsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [avgRating, setAvgRating] = useState(0);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await api.get<{ reviews: Review[]; avgRating: number }>(MERCHANT + '/reviews');
            setReviews(res.data.reviews);
            setAvgRating(res.data.avgRating);
        } catch { setReviews([]); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const res = await api.post<{ review: Review }>(MERCHANT + `/reviews/${reviewId}/reply`, { reply: replyText.trim() });
            setReviews(prev => prev.map(r => r.id === reviewId ? res.data.review : r));
            setReplyingTo(null);
            setReplyText('');
        } catch { Alert.alert('Error', 'Failed to submit reply'); }
        finally { setSubmitting(false); }
    };

    const renderStars = (rating: number) => (
        <View style={styles.stars}>
            {[1,2,3,4,5].map((s) => (
                <Star key={s} size={13} color={s <= rating ? '#F59E0B' : '#E2E8F0'}
                    fill={s <= rating ? '#F59E0B' : 'transparent'} strokeWidth={2} />
            ))}
        </View>
    );

    const renderReview = ({ item, index }: { item: Review; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <View style={styles.reviewCard}>
                {/* Header */}
                <View style={styles.reviewHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitial}>{(item.user.name ?? 'U')[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.reviewMeta}>
                        <Text style={styles.reviewerName}>{item.user.name ?? 'Customer'}</Text>
                        <Text style={styles.reviewDate}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.ratingPill}>
                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingPillText}>{item.rating.toFixed(1)}</Text>
                    </View>
                </View>

                {renderStars(item.rating)}
                {item.comment && <Text style={styles.comment}>{item.comment}</Text>}

                <View style={styles.bookingTag}>
                    <Hash size={10} color="#94A3B8" strokeWidth={2.5} />
                    <Text style={styles.bookingText}>{item.booking?.bookingNumber}</Text>
                </View>

                {/* Reply Section */}
                {item.merchantReply ? (
                    <View style={styles.replyBox}>
                        <View style={styles.replyHeader}>
                            <MessageCircle size={12} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.replyLabel}>Your Reply</Text>
                        </View>
                        <Text style={styles.replyContent}>{item.merchantReply}</Text>
                    </View>
                ) : (
                    <>
                        {replyingTo === item.id ? (
                            <View style={styles.replyInput}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Write your reply..."
                                    placeholderTextColor="#CBD5E1"
                                    value={replyText}
                                    onChangeText={setReplyText}
                                    multiline
                                    maxLength={1000}
                                    autoFocus
                                />
                                <View style={styles.replyActions}>
                                    <Pressable onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.sendBtn, submitting && { opacity: 0.5 }]}
                                        onPress={() => handleReply(item.id)}
                                        disabled={submitting}
                                    >
                                        <Send size={13} color="#FFF" strokeWidth={2.5} />
                                        <Text style={styles.sendBtnText}>{submitting ? 'Sending...' : 'Reply'}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            <Pressable
                                style={styles.replyTrigger}
                                onPress={() => setReplyingTo(item.id)}
                            >
                                <MessageCircle size={14} color={Colors.primary} strokeWidth={2} />
                                <Text style={styles.replyTriggerText}>Reply to this review</Text>
                            </Pressable>
                        )}
                    </>
                )}
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Reviews</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Overall Rating */}
            {avgRating > 0 && (
                <View style={styles.overallRow}>
                    <View style={styles.overallBadge}>
                        <Star size={16} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.overallText}>{avgRating.toFixed(1)}</Text>
                        <Text style={styles.overallSub}>avg · {reviews.length} reviews</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchReviews(); }}
                            colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <MessageCircle size={32} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No reviews yet</Text>
                            <Text style={styles.emptyHint}>Customer reviews will appear after completed orders</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    overallRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    overallBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 14, alignSelf: 'flex-start',
    },
    overallText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    overallSub: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    list: { padding: Spacing.lg, gap: 12, paddingBottom: 40 },

    reviewCard: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18, gap: 10,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarCircle: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: Colors.primary + '14', justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    reviewMeta: { flex: 1 },
    reviewerName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    reviewDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
    ratingPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    ratingPillText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
    stars: { flexDirection: 'row', gap: 2 },
    comment: { fontSize: 14, color: '#334155', lineHeight: 20, fontWeight: '500' },
    bookingTag: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, alignSelf: 'flex-start',
    },
    bookingText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

    replyBox: {
        backgroundColor: Colors.primary + '08', borderLeftWidth: 3, borderLeftColor: Colors.primary,
        padding: 12, borderRadius: 12,
    },
    replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    replyLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    replyContent: { fontSize: 13, color: '#334155', lineHeight: 20, fontWeight: '500' },
    replyTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    replyTriggerText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

    replyInput: { gap: 10 },
    input: {
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 14,
        padding: 14, fontSize: 14, backgroundColor: '#F8FAFC', color: '#0F172A',
        fontWeight: '500', minHeight: 60, textAlignVertical: 'top',
    },
    replyActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14 },
    cancelText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    sendBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    },
    sendBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    emptyHint: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
});
