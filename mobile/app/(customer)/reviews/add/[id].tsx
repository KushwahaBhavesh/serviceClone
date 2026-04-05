import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Pressable, 
    Image, 
    ActivityIndicator, 
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
} from 'react-native-reanimated';
import { 
    Star, 
    ChevronLeft, 
    Camera, 
    X, 
    Sparkles, 
    Check, 
    MessageSquare,
    Image as ImageIcon,
    ShieldCheck
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../../constants/theme';
import { bookingApi } from '../../../../lib/marketplace';
import { useToast } from '../../../../context/ToastContext';
import { Input } from '../../../../components/ui/Input';

export default function AddReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();
    
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.7,
        });

        if (!result.canceled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newImages = result.assets.map(asset => asset.uri);
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            showInfo('Please select an intelligence rating.');
            return;
        }

        setSubmitting(true);
        try {
            if (!id) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            
            await bookingApi.createReview({
                bookingId: id,
                rating,
                comment,
                imageUrls: images,
            } as any);

            showSuccess('Intelligence report submitted. Thank you.');
            
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error) {
            console.error('Failed to submit review:', error);
            showError('Failed to transmit feedback data.');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = () => (
        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable 
                    key={star} 
                    onPress={() => {
                        setRating(star);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }} 
                    style={styles.starBtn}
                >
                    <Star
                        size={40}
                        color={star <= rating ? "#F59E0B" : "#E2E8F0"}
                        fill={star <= rating ? "#F59E0B" : "transparent"}
                        strokeWidth={star <= rating ? 2 : 1.5}
                    />
                </Pressable>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* Sticky Oracle Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>RATE SERVICE</Text>
                        <Text style={styles.headerSubtitle}>Intelligence Feedback</Text>
                    </View>
                    <Animated.View entering={FadeInRight} style={styles.oracleBadge}>
                        <Sparkles size={12} color={Colors.primary} strokeWidth={3} />
                        <Text style={styles.oracleBadgeText}>ORACLE</Text>
                    </Animated.View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView 
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 80, paddingBottom: 140 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Immersive Header */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
                        <View style={styles.heroIconBox}>
                            <Sparkles size={32} color={Colors.primary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.heroTitle}>Evaluate Experience</Text>
                        <Text style={styles.heroSubtitle}>Your feedback optimizes our service infrastructure.</Text>
                    </Animated.View>

                    {/* Star Selector Bento Card */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.bentoCard}>
                        <Text style={styles.cardLabel}>OVERALL RATING</Text>
                        <StarRating />
                        <Text style={styles.ratingHint}>
                            {rating === 0 ? 'Select a rating level' : 
                             rating === 5 ? 'Exceptional Performance' :
                             rating === 4 ? 'Optimal Response' :
                             rating === 3 ? 'Neutral Efficiency' :
                             rating === 2 ? 'Suboptimal Execution' : 'Critical Failure'}
                        </Text>
                    </Animated.View>

                    {/* Comment Bento Card */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bentoCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconSmall, { backgroundColor: '#3B82F610' }]}>
                                <MessageSquare size={14} color="#3B82F6" strokeWidth={2.5} />
                            </View>
                            <Text style={styles.cardLabel}>DETAILED LOG</Text>
                        </View>
                        <Input
                            style={styles.commentInput}
                            placeholder="Provide your specific observations..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                            containerStyle={styles.inputInner}
                        />
                    </Animated.View>

                    {/* Photo Bento Card */}
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bentoCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconSmall, { backgroundColor: '#10B98110' }]}>
                                <ImageIcon size={14} color="#10B981" strokeWidth={2.5} />
                            </View>
                            <Text style={styles.cardLabel}>VISUAL EVIDENCE ({images.length}/5)</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                            <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                                <Camera size={24} color="#94A3B8" strokeWidth={2} />
                                <Text style={styles.addPhotoText}>ATTACH</Text>
                            </Pressable>

                            {images.map((uri, index) => (
                                <View key={uri} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                                        <X size={14} color="#FFF" strokeWidth={3} />
                                    </Pressable>
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.luxeInfoCard}>
                        <ShieldCheck size={20} color={Colors.primary} strokeWidth={2.5} />
                        <Text style={styles.luxeInfoText}>
                            Your encrypted feedback is transmitted directly to our service optimization engine.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Immersive Footer Action */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.footerContent}>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            (submitting || rating === 0) && styles.btnDisabled,
                            pressed && { transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#FF7A00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Check size={20} color="#FFF" strokeWidth={3} />
                                    <Text style={styles.btnText}>COMMIT FEEDBACK</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    
    // Sticky Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20 },

    // Hero Section
    heroSection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
    heroIconBox: { width: 64, height: 64, borderRadius: 24, backgroundColor: Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    heroSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '600', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

    // Bento Card
    bentoCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    cardLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    iconSmall: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    // Stars
    starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 10 },
    starBtn: { padding: 4 },
    ratingHint: { fontSize: 12, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },

    // Inputs
    inputInner: { borderWidth: 0, paddingHorizontal: 0, marginBottom: 0, backgroundColor: 'transparent' },
    commentInput: { fontSize: 15, fontWeight: '600', color: '#0F172A', minHeight: 100 },

    // Photos
    imageScroll: { flexDirection: 'row', marginTop: 5 },
    addPhotoBtn: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed', marginRight: 12, gap: 4 },
    addPhotoText: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
    imageWrapper: { position: 'relative', marginRight: 12 },
    imagePreview: { width: 80, height: 80, borderRadius: 20 },
    removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },

    luxeInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: '#F1F5F9' },
    luxeInfoText: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '600', lineHeight: 20 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden' },
    footerContent: { paddingHorizontal: 25, paddingVertical: 20 },
    primaryBtn: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    btnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    btnDisabled: { opacity: 0.6 },
});
