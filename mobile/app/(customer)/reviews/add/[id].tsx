import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';
import { bookingApi } from '../../../../lib/marketplace';
import { Button } from '../../../../components/ui/Button';

export default function AddReviewScreen() {
    const router = useRouter();
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
            const newImages = result.assets.map(asset => asset.uri);
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Selection Required', 'Please select a star rating.');
            return;
        }

        setSubmitting(true);
        try {
            if (!id) return;
            // Note: In a real scenario, we would upload images to S3/Supabase first
            // and get the URLs. For now, we'll pass the local URIs as placeholders.
            await bookingApi.createReview({
                bookingId: id,
                rating,
                comment,
                imageUrls: images,
            } as any);

            Alert.alert('Success', 'Thank you for your feedback!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Failed to submit review:', error);
            Alert.alert('Error', 'Could not submit your review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Rate Service',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: 'white' },
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>How was your experience?</Text>
                    <Text style={styles.subtitle}>Your feedback helps us improve our services.</Text>
                </View>

                {/* Star Selector */}
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable key={star} onPress={() => setRating(star)} style={styles.star}>
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={44}
                                color={star <= rating ? "#F59E0B" : Colors.border}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Comment Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Add a Comment (Optional)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Tell us what you liked or what could be better..."
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />
                </View>

                {/* Photo Upload */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.sectionTitle}>Add Photos</Text>
                        <Text style={styles.limitText}>{images.length}/5</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={28} color={Colors.textMedium} />
                        </Pressable>

                        {images.map((uri, index) => (
                            <View key={uri} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.image} />
                                <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={20} color="white" />
                                </Pressable>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={submitting ? "Submitting..." : "Submit Review"}
                    onPress={handleSubmit}
                    disabled={submitting || rating === 0}
                    loading={submitting}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xxl,
    },
    star: {
        padding: 4,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textDark,
    },
    limitText: {
        fontSize: FontSize.sm,
        color: Colors.textLight,
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        fontSize: FontSize.md,
        color: Colors.textDark,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 120,
    },
    imagesScroll: {
        flexDirection: 'row',
        marginTop: Spacing.sm,
    },
    addPhotoBtn: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginRight: Spacing.md,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: Spacing.md,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
    },
    removeBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 8,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
});
