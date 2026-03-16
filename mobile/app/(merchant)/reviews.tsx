import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const MERCHANT = '/api/v1/merchant';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    merchantReply: string | null;
    merchantReplyAt: string | null;
    createdAt: string;
    booking: { bookingNumber: string };
    user: { name: string | null; avatarUrl: string | null };
}

export default function ReviewsScreen() {
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
        } catch {
            setReviews([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ review: Review }>(MERCHANT + `/reviews/${reviewId}/reply`, { reply: replyText.trim() });
            setReviews(prev => prev.map(r => r.id === reviewId ? res.data.review : r));
            setReplyingTo(null);
            setReplyText('');
        } catch {
            Alert.alert('Error', 'Failed to submit reply');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number) => (
        <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={14}
                    color={star <= rating ? Colors.warning : Colors.textMuted}
                />
            ))}
        </View>
    );

    const renderReview = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
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
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
                </View>
            </View>
            {renderStars(item.rating)}
            {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
            <Text style={styles.bookingRef}>Order: {item.booking?.bookingNumber}</Text>

            {/* Merchant Reply */}
            {item.merchantReply ? (
                <View style={styles.replyBox}>
                    <View style={styles.replyHeader}>
                        <Ionicons name="chatbubble" size={12} color={Colors.primary} />
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
                                value={replyText}
                                onChangeText={setReplyText}
                                multiline
                                maxLength={1000}
                                autoFocus
                            />
                            <View style={styles.replyActions}>
                                <TouchableOpacity onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                                    <Text style={styles.cancelBtn}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.sendBtn, submitting && { opacity: 0.6 }]}
                                    onPress={() => handleReply(item.id)}
                                    disabled={submitting}
                                >
                                    <Ionicons name="send" size={14} color={Colors.textOnPrimary} />
                                    <Text style={styles.sendBtnText}>{submitting ? 'Sending...' : 'Reply'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.replyTrigger} onPress={() => setReplyingTo(item.id)}>
                            <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
                            <Text style={styles.replyTriggerText}>Reply to this review</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Reviews',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />
            <View style={styles.headerRow}>
                {avgRating > 0 && (
                    <View style={styles.overallRating}>
                        <Ionicons name="star" size={18} color={Colors.warning} />
                        <Text style={styles.overallRatingText}>{avgRating.toFixed(1)}</Text>
                        <Text style={styles.overallRatingSub}>avg · {reviews.length} reviews</Text>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchReviews(); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="chatbubble-ellipses" size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyTitle}>No reviews yet</Text>
                            <Text style={styles.emptyText}>Customer reviews will appear here after completed orders</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBtn: { paddingHorizontal: Spacing.sm },
    headerRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
    overallRating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warning + '18', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
    overallRatingText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    overallRatingSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
    list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
    reviewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
    reviewMeta: { flex: 1 },
    reviewerName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    reviewDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.warning + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
    ratingValue: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
    stars: { flexDirection: 'row', gap: 2 },
    comment: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
    bookingRef: { fontSize: FontSize.xs, color: Colors.textMuted },

    // Reply
    replyBox: { backgroundColor: Colors.primary + '08', borderLeftWidth: 3, borderLeftColor: Colors.primary, padding: Spacing.sm, borderRadius: BorderRadius.sm },
    replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    replyLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
    replyContent: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
    replyTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
    replyTriggerText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
    replyInput: { gap: Spacing.sm },
    input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.sm, fontSize: FontSize.sm, backgroundColor: Colors.backgroundAlt, color: Colors.text, minHeight: 60, textAlignVertical: 'top' },
    replyActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.md },
    cancelBtn: { fontSize: FontSize.sm, color: Colors.textSecondary },
    sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.sm },
    sendBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textOnPrimary },

    // Empty
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm, paddingHorizontal: Spacing.lg },
    emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textMuted },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
