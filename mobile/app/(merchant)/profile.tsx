import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    Pressable, ActivityIndicator, TextInput, Alert, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeft, Pencil, Check, Camera, Store,
    Phone, MapPin, ShieldCheck, Star, ChevronRight, AlertCircle,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi, MerchantSettings } from '../../lib/merchant';
import { getImageUrl } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function MerchantProfileScreen() {
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState<MerchantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        businessName: '', description: '', phone: '',
        address: '', city: '', state: '', zipCode: '',
        logoUrl: '', coverImageUrl: '',
    });

    const fetchSettings = useCallback(async () => {
        try {
            const response = await merchantApi.getSettings();
            const s = response.data.settings;
            setSettings(s);
            setForm({
                businessName: s.businessName || '', description: s.description || '',
                phone: s.phone || '', address: s.address || '', city: s.city || '',
                state: s.state || '', zipCode: s.zipCode || '',
                logoUrl: s.logoUrl || '', coverImageUrl: s.coverImageUrl || '',
            });
        } catch { console.error('Error fetching settings'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);
    const onRefresh = () => { setRefreshing(true); fetchSettings(); };

    const handlePickImage = async (field: 'logoUrl' | 'coverImageUrl') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: field === 'logoUrl' ? [1,1] : [16,9], quality: 0.8,
        });
        if (!result.canceled) {
            try {
                const uploadRes = await merchantApi.uploadFile(result.assets[0].uri);
                setForm(p => ({ ...p, [field]: uploadRes.data.fileUrl }));
            } catch { Alert.alert('Error', 'Failed to upload image'); }
        }
    };

    const handleSave = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await merchantApi.updateSettings(form);
            setEditing(false);
            fetchSettings();
            Alert.alert('Success', 'Settings updated');
        } catch { Alert.alert('Error', 'Failed to update settings'); }
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const verStatus = settings?.verificationStatus ?? 'NOT_SUBMITTED';
    const verColor = verStatus === 'APPROVED' ? '#10B981' : verStatus === 'REJECTED' ? '#EF4444' : '#F59E0B';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Cover Section */}
                <Pressable
                    disabled={!editing}
                    onPress={() => handlePickImage('coverImageUrl')}
                    style={styles.coverWrapper}
                >
                    {form.coverImageUrl ? (
                        <Image source={{ uri: getImageUrl(form.coverImageUrl) || undefined }} style={styles.coverImage} />
                    ) : (
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[styles.coverImage, styles.coverPlaceholder]}
                        >
                            <Camera size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                        </LinearGradient>
                    )}
                    {editing && (
                        <View style={styles.imageEditOverlay}>
                            <Camera size={24} color="white" strokeWidth={2} />
                            <Text style={styles.overlayText}>Change Cover</Text>
                        </View>
                    )}
                </Pressable>

                {/* Floating Nav */}
                <View style={[styles.navbar, { top: insets.top + 10 }]}>
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.navCircle, pressed && { opacity: 0.7 }]}
                    >
                        <ChevronLeft size={22} color="#1E293B" />
                    </Pressable>
                    <Pressable
                        onPress={() => editing ? handleSave() : setEditing(true)}
                        style={({ pressed }) => [styles.navCircle, editing && styles.navCircleActive, pressed && { opacity: 0.7 }]}
                    >
                        {editing ? <Check size={20} color="#FFF" strokeWidth={2.5} />
                                 : <Pencil size={18} color="#1E293B" strokeWidth={2} />}
                    </Pressable>
                </View>

                {/* Identity */}
                <View style={styles.identitySection}>
                    <Pressable
                        disabled={!editing}
                        onPress={() => handlePickImage('logoUrl')}
                        style={styles.logoOuter}
                    >
                        {form.logoUrl ? (
                            <Image source={{ uri: getImageUrl(form.logoUrl) || undefined }} style={styles.logoImage} />
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <Store size={28} color={Colors.primary} strokeWidth={1.5} />
                            </View>
                        )}
                        {editing && (
                            <View style={styles.logoCameraBtn}>
                                <Camera size={12} color="#FFF" strokeWidth={2.5} />
                            </View>
                        )}
                    </Pressable>

                    <View style={styles.mainInfo}>
                        {editing ? (
                            <TextInput
                                style={styles.nameInput}
                                value={form.businessName}
                                onChangeText={(t) => setForm(p => ({ ...p, businessName: t }))}
                                placeholder="Business Name"
                                placeholderTextColor="#CBD5E1"
                            />
                        ) : (
                            <View style={styles.nameRow}>
                                <Text style={styles.businessName}>{settings?.businessName || 'Unnamed Business'}</Text>
                                {verStatus === 'APPROVED' && <ShieldCheck size={18} color="#10B981" fill="#10B981" />}
                            </View>
                        )}
                        <View style={styles.badgeRow}>
                            <View style={[styles.statusBadge, { backgroundColor: verColor + '14' }]}>
                                {verStatus === 'APPROVED'
                                    ? <ShieldCheck size={11} color={verColor} strokeWidth={2.5} />
                                    : <AlertCircle size={11} color={verColor} strokeWidth={2.5} />}
                                <Text style={[styles.statusText, { color: verColor }]}>{verStatus.replace('_', ' ')}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.ratingText}>{(settings?.rating ?? 0).toFixed(1)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.contentPadding}>
                    {/* Bio */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                        <Text style={styles.cardLabel}>ABOUT</Text>
                        {editing ? (
                            <TextInput
                                style={styles.bioInput}
                                value={form.description}
                                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                                placeholder="Tell customers about your services..."
                                placeholderTextColor="#CBD5E1"
                                multiline
                            />
                        ) : (
                            <Text style={styles.bioText}>
                                {settings?.description || 'No description provided yet. Add one to help customers find you.'}
                            </Text>
                        )}
                    </Animated.View>

                    {/* Contact Grid */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.gridSection}>
                        <View style={styles.gridItem}>
                            <View style={[styles.gridIcon, { backgroundColor: '#EEF2FF' }]}>
                                <Phone size={18} color="#6366F1" strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.gridLabel}>Phone</Text>
                                {editing ? (
                                    <TextInput style={styles.gridInput} value={form.phone}
                                        onChangeText={(t) => setForm(p => ({ ...p, phone: t }))} keyboardType="phone-pad" />
                                ) : (
                                    <Text style={styles.gridValue}>{settings?.phone || 'Not provided'}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.gridIcon, { backgroundColor: '#ECFDF5' }]}>
                                <MapPin size={18} color="#10B981" strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.gridLabel}>Location</Text>
                                {editing ? (
                                    <TextInput style={styles.gridInput} value={form.address}
                                        onChangeText={(t) => setForm(p => ({ ...p, address: t }))} placeholder="Address" placeholderTextColor="#CBD5E1" />
                                ) : (
                                    <Text style={styles.gridValue} numberOfLines={1}>{settings?.address || 'Set address'}</Text>
                                )}
                            </View>
                        </View>
                    </Animated.View>

                    {editing && (
                        <View style={styles.locationGroup}>
                            <View style={styles.row}>
                                <TextInput style={[styles.input, { flex: 1 }]} value={form.city}
                                    onChangeText={(t) => setForm(p => ({ ...p, city: t }))} placeholder="City" placeholderTextColor="#CBD5E1" />
                                <TextInput style={[styles.input, { flex: 1 }]} value={form.state}
                                    onChangeText={(t) => setForm(p => ({ ...p, state: t }))} placeholder="State" placeholderTextColor="#CBD5E1" />
                                <TextInput style={[styles.input, { width: 80 }]} value={form.zipCode}
                                    onChangeText={(t) => setForm(p => ({ ...p, zipCode: t }))} placeholder="Zip" keyboardType="number-pad" placeholderTextColor="#CBD5E1" />
                            </View>
                        </View>
                    )}

                    {/* KYC */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
                        <View style={styles.kycHeader}>
                            <Text style={styles.cardLabel}>VERIFICATION</Text>
                            <Pressable onPress={() => router.push('/(merchant)/verification')} style={styles.linkBtn}>
                                <Text style={styles.linkText}>View All</Text>
                                <ChevronRight size={14} color={Colors.primary} strokeWidth={2} />
                            </Pressable>
                        </View>
                        <View style={styles.kycStrip}>
                            {settings?.verificationDocs && settings.verificationDocs.length > 0 ? (
                                settings.verificationDocs.slice(0, 3).map((doc) => (
                                    <View key={doc.id} style={styles.kycChip}>
                                        {doc.fileUrl ? (
                                            <Image source={{ uri: getImageUrl(doc.fileUrl) || undefined }} style={styles.kycThumb} />
                                        ) : doc.status === 'APPROVED' ? (
                                            <Check size={12} color="#10B981" strokeWidth={2.5} />
                                        ) : (
                                            <AlertCircle size={12} color="#F59E0B" strokeWidth={2} />
                                        )}
                                        <Text style={styles.kycChipText}>{doc.type.replace(/_/g, ' ')}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyKycText}>No verification documents found.</Text>
                            )}
                        </View>
                    </Animated.View>

                    {!editing && verStatus !== 'APPROVED' && (
                        <Animated.View entering={FadeInDown.delay(400).springify()}>
                            <Pressable
                                onPress={() => router.push('/(merchant)/verification')}
                                style={({ pressed }) => [styles.verifyBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.verifyGradient}
                                >
                                    <Text style={styles.verifyBtnText}>Complete Verification</Text>
                                    <ChevronRight size={18} color="#FFF" strokeWidth={2} />
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    coverWrapper: { height: 220, width: '100%', position: 'relative' },
    coverImage: { width: '100%', height: '100%', backgroundColor: '#F1F5F9' },
    coverPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    imageEditOverlay: {
        ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    overlayText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 4 },

    navbar: {
        position: 'absolute', left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16,
    },
    navCircle: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    },
    navCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

    identitySection: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -40, alignItems: 'flex-end' },
    logoOuter: {
        width: 90, height: 90, borderRadius: 24, borderWidth: 4, borderColor: '#FFF',
        backgroundColor: '#FFF', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    logoImage: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    logoCameraBtn: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary,
        width: 26, height: 26, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2.5, borderColor: '#FFF',
    },
    mainInfo: { flex: 1, marginLeft: 14, paddingBottom: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    businessName: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
    nameInput: {
        fontSize: 20, fontWeight: '700', borderBottomWidth: 1.5,
        borderColor: '#E2E8F0', color: '#0F172A', paddingVertical: 4,
    },
    badgeRow: { flexDirection: 'row', marginTop: 6, gap: 8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    ratingText: { fontSize: 11, fontWeight: '800', color: '#D97706' },

    contentPadding: { paddingHorizontal: 20, marginTop: 24, gap: 12 },

    card: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    cardLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    bioText: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
    bioInput: {
        fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC', borderRadius: 14,
        padding: 14, minHeight: 100, textAlignVertical: 'top', fontWeight: '500',
        borderWidth: 1, borderColor: '#F1F5F9',
    },

    gridSection: { flexDirection: 'row', gap: 10 },
    gridItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', padding: 14, borderRadius: 16, gap: 10,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    gridIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    gridLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    gridValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    gridInput: { fontSize: 13, fontWeight: '700', padding: 0, color: Colors.primary },

    locationGroup: { gap: 10 },
    row: { flexDirection: 'row', gap: 8 },
    input: {
        backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 14, fontWeight: '600', color: '#0F172A', borderWidth: 1, borderColor: '#F1F5F9',
    },

    kycHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    linkText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
    kycStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    kycChip: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
        borderWidth: 1, borderColor: '#F1F5F9', gap: 6,
    },
    kycThumb: { width: 18, height: 18, borderRadius: 5, backgroundColor: '#E2E8F0' },
    kycChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    emptyKycText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', fontWeight: '500' },

    verifyBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    verifyGradient: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 16, gap: 8,
    },
    verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
