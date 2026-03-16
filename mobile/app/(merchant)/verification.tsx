import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { merchantApi, KycDocType, MerchantSettings } from '../../lib/merchant';
import { getImageUrl } from '../../lib/api';

const DOC_TYPES: { label: string; value: KycDocType; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'PAN Card', value: 'PAN_CARD', icon: 'card' },
    { label: 'Aadhaar Card', value: 'AADHAAR', icon: 'finger-print' },
    { label: 'GST Certificate', value: 'GST_CERTIFICATE', icon: 'receipt' },
    { label: 'Business License', value: 'BUSINESS_LICENSE', icon: 'business' },
    { label: 'Bank Proof', value: 'BANK_PROOF', icon: 'library' },
];

export default function MerchantVerificationScreen() {
    const [selectedType, setSelectedType] = useState<KycDocType>('PAN_CARD');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [docs, setDocs] = useState<any[]>([]);

    const fetchDocs = useCallback(async () => {
        try {
            const response = await merchantApi.getSettings();
            setDocs(response.data.settings.verificationDocs || []);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDocs();
    };

    const handleSelectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) {
            Alert.alert('Error', 'Please select an image first');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload file to common upload endpoint
            const uploadRes = await merchantApi.uploadFile(selectedImage);
            const { fileUrl } = uploadRes.data;

            // 2. Submit KYC document with the received file URL
            await merchantApi.submitKycDoc({
                type: selectedType,
                fileUrl,
            });

            Alert.alert('Success', 'Document submitted successfully. Our team will review it shortly.');
            setSelectedImage(null);
            fetchDocs();
        } catch (error: any) {
            console.error('KYC Upload error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit document');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Verification</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
                    <Text style={styles.infoTitle}>Why Verification?</Text>
                    <Text style={styles.infoDesc}>
                        Verifying your business builds trust with customers and unlocks higher earning potential on the platform. Upload valid documents to get the "Verified" badge.
                    </Text>
                </View>

                {/* Upload History Section */}
                {docs.length > 0 && (
                    <View style={styles.historySection}>
                        <Text style={styles.sectionTitle}>Review Status</Text>
                        <View style={styles.historyList}>
                            {docs.map((doc) => (
                                <View key={doc.id} style={styles.historyCard}>
                                    <View style={styles.historyImageContainer}>
                                        <Image
                                            source={{ uri: getImageUrl(doc.fileUrl) || undefined }}
                                            style={styles.historyThumb}
                                        />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyType}>{doc.type.replace(/_/g, ' ')}</Text>
                                        <Text style={styles.historyDate}>Submitted Document</Text>
                                    </View>
                                    <View style={[
                                        styles.statusChip,
                                        { backgroundColor: doc.status === 'APPROVED' ? '#DCFCE7' : '#FEF3C7' }
                                    ]}>
                                        <Text style={[
                                            styles.statusLabel,
                                            { color: doc.status === 'APPROVED' ? '#166534' : '#92400E' }
                                        ]}>
                                            {doc.status}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Select Document Type</Text>
                <View style={styles.typeList}>
                    {DOC_TYPES.map((doc) => (
                        <TouchableOpacity
                            key={doc.value}
                            style={[
                                styles.typeOption,
                                selectedType === doc.value && styles.typeOptionSelected
                            ]}
                            onPress={() => setSelectedType(doc.value)}
                        >
                            <Ionicons
                                name={doc.icon}
                                size={24}
                                color={selectedType === doc.value ? Colors.primary : Colors.textSecondary}
                            />
                            <Text style={[
                                styles.typeLabel,
                                selectedType === doc.value && styles.typeLabelSelected
                            ]}>
                                {doc.label}
                            </Text>
                            {selectedType === doc.value && (
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.checkIcon} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.uploadSection}>
                    <Text style={styles.sectionTitle}>Upload Document</Text>
                    <TouchableOpacity style={styles.uploadPlaceholder} onPress={handleSelectImage} activeOpacity={0.7}>
                        {selectedImage ? (
                            <View style={styles.selectedImageContainer}>
                                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                <View style={styles.changeOverlay}>
                                    <Ionicons name="camera" size={20} color="white" />
                                    <Text style={styles.changeText}>Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.uploadIconCircle}>
                                    <Ionicons name="cloud-upload" size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.uploadMainText}>Tap to choose file</Text>
                                <Text style={styles.uploadSubText}>PNG or JPG (Max 5MB)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleUpload}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="paper-plane" size={20} color="#FFF" />
                            <Text style={styles.submitButtonText}>Submit Document</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

    content: {
        padding: Spacing.lg,
    },

    infoCard: {
        backgroundColor: Colors.primary + '10',
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    infoTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: Spacing.sm,
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },

    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },

    typeList: {
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    typeOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '05',
    },
    typeLabel: {
        fontSize: FontSize.sm,
        fontWeight: '500',
        color: Colors.text,
        marginLeft: Spacing.md,
    },
    typeLabelSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    checkIcon: {
        marginLeft: 'auto',
    },

    uploadSection: {
        marginBottom: Spacing.xxl,
    },
    uploadPlaceholder: {
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    uploadMainText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    uploadSubText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    selectedImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    changeOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    changeText: {
        fontSize: 14,
        color: 'white',
        fontWeight: '700',
    },

    footer: {
        padding: Spacing.lg,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    historySection: {
        marginBottom: Spacing.xl,
    },
    historyList: {
        gap: Spacing.sm,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    historyImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        overflow: 'hidden',
    },
    historyThumb: {
        width: '100%',
        height: '100%',
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    historyDate: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 4,
    },
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: '800',
    },
});
