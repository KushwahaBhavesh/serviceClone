import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Alert, Image, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
    ChevronLeft, ShieldCheck, CreditCard, Fingerprint,
    FileText, Building2, Landmark, Upload, Camera,
    Check, Clock, Send,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi, KycDocType } from '../../lib/merchant';
import { getImageUrl } from '../../lib/api';

const DOC_TYPES: { label: string; value: KycDocType; icon: React.ReactNode }[] = [
    { label: 'PAN Card', value: 'PAN_CARD', icon: <CreditCard size={20} color="#6366F1" strokeWidth={2} /> },
    { label: 'Aadhaar Card', value: 'AADHAAR', icon: <Fingerprint size={20} color="#EC4899" strokeWidth={2} /> },
    { label: 'GST Certificate', value: 'GST_CERTIFICATE', icon: <FileText size={20} color="#10B981" strokeWidth={2} /> },
    { label: 'Business License', value: 'BUSINESS_LICENSE', icon: <Building2 size={20} color="#F59E0B" strokeWidth={2} /> },
    { label: 'Bank Proof', value: 'BANK_PROOF', icon: <Landmark size={20} color="#0EA5E9" strokeWidth={2} /> },
];

const DOC_ICON_BG: Record<string, string> = {
    PAN_CARD: '#EEF2FF', AADHAAR: '#FDF2F8',
    GST_CERTIFICATE: '#ECFDF5', BUSINESS_LICENSE: '#FFFBEB', BANK_PROOF: '#F0F9FF',
};

export default function MerchantVerificationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
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
        } catch { console.error('Error fetching docs'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);
    const onRefresh = () => { setRefreshing(true); fetchDocs(); };

    const handleSelectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera roll permission needed.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [4,3], quality: 0.8,
        });
        if (!result.canceled) setSelectedImage(result.assets[0].uri);
    };

    const handleUpload = async () => {
        if (!selectedImage) { Alert.alert('Error', 'Please select an image first'); return; }
        setSubmitting(true);
        try {
            const uploadRes = await merchantApi.uploadFile(selectedImage);
            await merchantApi.submitKycDoc({ type: selectedType, fileUrl: uploadRes.data.fileUrl });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Document submitted. Our team will review it shortly.');
            setSelectedImage(null);
            fetchDocs();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit document');
        } finally { setSubmitting(false); }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

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
                <Text style={styles.headerTitle}>Verification</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Info Banner */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <LinearGradient
                        colors={[Colors.primary + '12', Colors.primary + '04']}
                        style={styles.infoCard}
                    >
                        <ShieldCheck size={28} color={Colors.primary} strokeWidth={1.5} />
                        <Text style={styles.infoTitle}>Why Verification?</Text>
                        <Text style={styles.infoDesc}>
                            Verifying your business builds trust with customers and unlocks higher earning potential. Upload valid documents for the "Verified" badge.
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* History */}
                {docs.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
                        <Text style={styles.cardLabel}>REVIEW STATUS</Text>
                        {docs.map((doc) => (
                            <View key={doc.id} style={styles.historyRow}>
                                <View style={styles.historyImageWrap}>
                                    <Image source={{ uri: getImageUrl(doc.fileUrl) || undefined }} style={styles.historyThumb} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyType}>{doc.type.replace(/_/g, ' ')}</Text>
                                    <Text style={styles.historyDate}>Submitted Document</Text>
                                </View>
                                <View style={[styles.statusChip, {
                                    backgroundColor: doc.status === 'APPROVED' ? '#ECFDF5' : '#FEF3C7',
                                }]}>
                                    {doc.status === 'APPROVED'
                                        ? <Check size={10} color="#166534" strokeWidth={2.5} />
                                        : <Clock size={10} color="#92400E" strokeWidth={2} />}
                                    <Text style={[styles.statusLabel, {
                                        color: doc.status === 'APPROVED' ? '#166534' : '#92400E',
                                    }]}>{doc.status}</Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                )}

                {/* Doc Type Selection */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                    <Text style={styles.cardLabel}>SELECT DOCUMENT TYPE</Text>
                    <View style={{ gap: 8 }}>
                        {DOC_TYPES.map((doc) => {
                            const isActive = selectedType === doc.value;
                            return (
                                <Pressable
                                    key={doc.value}
                                    onPress={() => { setSelectedType(doc.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    style={[styles.typeOption, isActive && styles.typeOptionActive]}
                                >
                                    <View style={[styles.typeIconBox, { backgroundColor: DOC_ICON_BG[doc.value] || '#F1F5F9' }]}>
                                        {doc.icon}
                                    </View>
                                    <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{doc.label}</Text>
                                    {isActive && <Check size={16} color={Colors.primary} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Upload Section */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.card}>
                    <Text style={styles.cardLabel}>UPLOAD DOCUMENT</Text>
                    <Pressable style={styles.uploadArea} onPress={handleSelectImage}>
                        {selectedImage ? (
                            <View style={styles.previewWrap}>
                                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                <View style={styles.changeOverlay}>
                                    <Camera size={20} color="#FFF" strokeWidth={2} />
                                    <Text style={styles.changeText}>Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.uploadIconCircle}>
                                    <Upload size={24} color={Colors.primary} strokeWidth={2} />
                                </View>
                                <Text style={styles.uploadMainText}>Tap to choose file</Text>
                                <Text style={styles.uploadSubText}>PNG or JPG (Max 5MB)</Text>
                            </>
                        )}
                    </Pressable>
                </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <Pressable
                    onPress={handleUpload} disabled={submitting}
                    style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }, submitting && { opacity: 0.5 }]}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                    >
                        {submitting ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Send size={18} color="#FFF" strokeWidth={2} />
                                <Text style={styles.submitText}>Submit Document</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

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

    scroll: { padding: Spacing.lg, gap: 12, paddingBottom: 20 },

    infoCard: {
        borderRadius: 20, padding: 24, alignItems: 'center',
        borderWidth: 1, borderColor: Colors.primary + '20',
    },
    infoTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginTop: 10, marginBottom: 4 },
    infoDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, fontWeight: '500' },

    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    cardLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

    historyRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    },
    historyImageWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', overflow: 'hidden' },
    historyThumb: { width: '100%', height: '100%' },
    historyType: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    historyDate: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    typeOption: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#F1F5F9',
    },
    typeOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
    typeIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    typeLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
    typeLabelActive: { color: Colors.primary, fontWeight: '700' },

    uploadArea: {
        borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
        borderRadius: 16, padding: 28, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FAFBFC',
    },
    uploadIconCircle: {
        width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.primary + '12',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    uploadMainText: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
    uploadSubText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    previewWrap: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    changeOverlay: {
        ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center', alignItems: 'center', gap: 4,
    },
    changeText: { fontSize: 14, color: '#FFF', fontWeight: '700' },

    footer: {
        padding: Spacing.lg, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    submitBtn: { borderRadius: 16, overflow: 'hidden' },
    submitGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
