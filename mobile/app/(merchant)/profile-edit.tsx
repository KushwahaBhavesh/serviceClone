import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    Pressable, ActivityIndicator, TextInput, Alert, Image, Dimensions,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, SlideInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import {
    ChevronLeft, Check, Camera, Store,
    Phone, MapPin, ShieldCheck, Star,
    Save, Navigation2, Info, ArrowRight,
    Map, Mail, Globe, Sparkles, Building,
    AtSign, Briefcase, User,
} from 'lucide-react-native';
import * as Location from 'expo-location';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi, MerchantSettings } from '../../lib/merchant';
import { getImageUrl } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function MerchantProfileEditScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [settings, setSettings] = useState<MerchantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        businessName: '', description: '', phone: '',
        address: '', city: '', state: '', zipCode: '',
        logoUrl: '', coverImageUrl: '',
        latitude: null as number | null, longitude: null as number | null,
        serviceRadius: 50,
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
                latitude: s.latitude, longitude: s.longitude,
                serviceRadius: s.serviceRadius || 50,
            });
        } catch { console.error('Error fetching settings'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);
    const onRefresh = () => { setRefreshing(true); fetchSettings(); };

    const handlePickImage = async (field: 'logoUrl' | 'coverImageUrl') => {
        if (!editing) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, aspect: field === 'logoUrl' ? [1,1] : [16,9], quality: 0.8,
        });
        if (!result.canceled) {
            try {
                const uploadRes = await merchantApi.uploadFile(result.assets[0].uri);
                setForm(p => ({ ...p, [field]: uploadRes.data.fileUrl }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch { showError('Failed to upload image'); }
        }
    };

    const handleSave = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await merchantApi.updateSettings(form);
            setEditing(false);
            fetchSettings();
            showSuccess('Profile updated successfully');
        } catch { showError('Failed to update settings'); }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const verStatus = settings?.verificationStatus ?? 'NOT_SUBMITTED';
    const verColor = verStatus === 'APPROVED' ? '#10B981' : verStatus === 'REJECTED' ? '#EF4444' : '#F59E0B';

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* ─── Executive Sticky Header ─── */}
            <View style={[styles.header, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <Pressable 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditing(!editing);
                        }}
                        style={[styles.editCircle, editing && styles.editCircleActive]}
                    >
                        {editing ? <Check size={20} color={Colors.primary} /> : <Sparkles size={18} color="#94A3B8" />}
                    </Pressable>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 220 }}
                    stickyHeaderIndices={[2, 4, 6]}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={[Colors.primary]}
                            progressViewOffset={insets.top + 70}
                        />
                    }
                >
                    {/* ─── Executive Hero Header ─── */}
                    <View style={styles.heroSection}>
                        <Pressable 
                            disabled={!editing} 
                            onPress={() => handlePickImage('coverImageUrl')}
                            style={styles.coverAnchor}
                        >
                            {form.coverImageUrl ? (
                                <Image source={{ uri: getImageUrl(form.coverImageUrl) || undefined }} style={styles.coverImg} />
                            ) : (
                                <LinearGradient colors={['#F1F5F9', '#CBD5E1']} style={styles.coverImg}>
                                    <Camera size={32} color="#94A3B8" />
                                </LinearGradient>
                            )}
                            {editing && <View style={styles.coverOverlay}><Camera size={24} color="white" /></View>}
                        </Pressable>

                        <View style={styles.identityOverlay}>
                            <Pressable 
                                disabled={!editing} 
                                onPress={() => handlePickImage('logoUrl')}
                                style={styles.logoSeal}
                            >
                                {form.logoUrl ? (
                                    <Image source={{ uri: getImageUrl(form.logoUrl) || undefined }} style={styles.logoImg} />
                                ) : (
                                    <View style={styles.logoPlaceholder}><Store size={40} color={Colors.primary} /></View>
                                )}
                                {editing && <View style={styles.logoCam}><Camera size={14} color="white" /></View>}
                            </Pressable>
                        </View>
                    </View>

                    {/* ─── Business Headline ─── */}
                    <View style={styles.headlineBox}>
                        {editing ? (
                            <TextInput
                                style={styles.headlineInput}
                                value={form.businessName}
                                onChangeText={(t: string) => setForm(p => ({ ...p, businessName: t }))}
                                placeholder="Business Name"
                                placeholderTextColor="#CBD5E1"
                            />
                        ) : (
                            <View style={styles.titleRow}>
                                <Text style={styles.businessTitle}>{settings?.businessName || 'Elite Merchant'}</Text>
                                {verStatus === 'APPROVED' && <ShieldCheck size={20} color="#10B981" fill="#10B981" />}
                            </View>
                        )}
                        <View style={styles.headlineMeta}>
                            <View style={[styles.verTag, { backgroundColor: verColor + '15' }]}>
                                <Text style={[styles.verText, { color: verColor }]}>{verStatus.replace(/_/g, ' ')}</Text>
                            </View>
                            <View style={styles.ratingBox}>
                                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.ratingLabel}>{(settings?.rating ?? 5.0).toFixed(1)} Overall Rating</Text>
                            </View>
                        </View>
                    </View>

                    {/* ─── Section: Brand Identity ─── */}
                    <SectionTitle>BRAND IDENTITY</SectionTitle>
                    <View style={styles.sectionBody}>
                        <Text style={styles.fieldLabel}>BUSINESS MISSION</Text>
                        {editing ? (
                            <TextInput
                                style={styles.executiveTextArea}
                                value={form.description}
                                onChangeText={(t: string) => setForm(p => ({ ...p, description: t }))}
                                placeholder="State your professional business mission..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={4}
                            />
                        ) : (
                            <Text style={styles.bioText}>{settings?.description || 'No business description provided.'}</Text>
                        )}
                    </View>

                    {/* ─── Section: Contact Suite ─── */}
                    <SectionTitle>COMMUNICATION & LOGISTICS</SectionTitle>
                    <View style={styles.sectionBody}>
                        <ExecutiveField 
                            label="OFFICIAL HOTLINE" 
                            value={form.phone} 
                            icon={<Phone size={18} color="#94A3B8" />} 
                            editing={editing} 
                            onChange={(t: string) => setForm(p => ({...p, phone: t}))}
                            keyboard="phone-pad"
                        />
                        <View style={styles.fieldGap} />
                        <ExecutiveField 
                            label="BUSINESS HEADQUARTERS" 
                            value={form.address} 
                            icon={<Building size={18} color="#94A3B8" />} 
                            editing={editing} 
                            onChange={(t: string) => setForm(p => ({...p, address: t}))}
                        />
                    </View>

                    {/* ─── Section: Operational Reach ─── */}
                    <SectionTitle>OPERATIONAL GEOGRAPHY</SectionTitle>
                    <View style={styles.sectionBody}>
                        <View style={styles.tripleInputRow}>
                            <ExecutiveField label="CITY" value={form.city} editing={editing} onChange={(t: string) => setForm(p => ({...p, city: t}))} />
                            <ExecutiveField label="STATE" value={form.state} editing={editing} onChange={(t: string) => setForm(p => ({...p, state: t}))} />
                            <ExecutiveField label="ZIP" value={form.zipCode} editing={editing} onChange={(t: string) => setForm(p => ({...p, zipCode: t}))} keyboard="number-pad" />
                        </View>
                        
                        {editing && (
                            <Animated.View entering={FadeIn} style={styles.radiusControl}>
                                <View style={{ flex: 1.2 }}>
                                    <Text style={styles.fieldLabel}>SERVICE RADIUS (KM)</Text>
                                    <TextInput 
                                        style={styles.proInput} 
                                        value={String(form.serviceRadius)} 
                                        onChangeText={(t: string) => setForm(p => ({...p, serviceRadius: parseInt(t) || 0}))}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <Pressable 
                                    style={({ pressed }) => [styles.syncAction, pressed && { opacity: 0.8 }]}
                                    onPress={async () => {
                                        try {
                                            const { status } = await Location.requestForegroundPermissionsAsync();
                                            if (status !== 'granted') { showInfo('GPS permission required'); return; }
                                            const loc = await Location.getCurrentPositionAsync({});
                                            setForm(p => ({ ...p, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                            showSuccess('Operational coordinates updated.');
                                        } catch { showError('GPS link failed'); }
                                    }}
                                >
                                    <LinearGradient colors={[Colors.primary, '#FF914D']} style={styles.syncGradient}>
                                        <Navigation2 size={16} color="white" />
                                        <Text style={styles.syncText}>SYNC GPS</Text>
                                    </LinearGradient>
                                </Pressable>
                            </Animated.View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ─── Persistent Save Bar ─── */}
            {editing && (
                <Animated.View entering={SlideInDown.springify()} style={[styles.footerBar, { bottom: insets.bottom + 20 }]}>
                    <Pressable
                        onPress={handleSave}
                        style={({ pressed }) => [
                            styles.saveAction,
                            pressed && { transform: [{ scale: 0.97 }] }
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#FF7A00']}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Save size={22} color="white" strokeWidth={2.5} />
                            <Text style={styles.saveLabel}>PERFORM SYNC</Text>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

function SectionTitle({ children }: { children: string }) {
    return (
        <View style={styles.sectionHeader}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionHeaderText}>{children}</Text>
        </View>
    );
}

function ExecutiveField({ label, value, icon, editing, onChange, keyboard }: any) {
    return (
        <View style={styles.proFieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.proFieldOuter, !editing && styles.proFieldOuterDisabled]}>
                {icon && <View style={styles.proFieldIcon}>{icon}</View>}
                {editing ? (
                    <TextInput
                        style={styles.proInput}
                        value={value}
                        onChangeText={onChange}
                        placeholder="..."
                        placeholderTextColor="#CBD5E1"
                        keyboardType={keyboard || 'default'}
                    />
                ) : (
                    <Text style={styles.proText} numberOfLines={1}>{value || '--'}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    navBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
    editCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    editCircleActive: { backgroundColor: Colors.primary + '10' },

    // Hero
    heroSection: { height: 320, backgroundColor: '#FFF' },
    coverAnchor: { height: 260, width: '100%', position: 'relative' },
    coverImg: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    identityOverlay: { position: 'absolute', bottom: 10, left: 25 },
    logoSeal: { width: 120, height: 120, borderRadius: 30, backgroundColor: '#FFF', borderWidth: 6, borderColor: '#FFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 12 },
    logoImg: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoCam: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },

    // Headline
    headlineBox: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 30, backgroundColor: '#FFF' },
    businessTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    headlineInput: { fontSize: 24, fontWeight: '900', color: Colors.primary, borderBottomWidth: 2, borderColor: Colors.primary + '20', paddingVertical: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headlineMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
    verTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    verText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },

    // Sections
    sectionHeader: { paddingHorizontal: 25, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    sectionHeaderText: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
    sectionBody: { padding: 25, backgroundColor: '#FFF' },

    // Fields
    proFieldWrapper: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', letterSpacing: 1, marginBottom: 12, marginLeft: 2 },
    proFieldOuter: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#F1F5F9' },
    proFieldOuterDisabled: { backgroundColor: '#FFF' },
    proFieldIcon: { marginRight: 12 },
    proInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
    proText: { fontSize: 15, fontWeight: '700', color: '#475569' },
    fieldGap: { height: 20 },
    executiveTextArea: { minHeight: 120, backgroundColor: '#F8FAFC', borderRadius: 18, padding: 20, fontSize: 15, color: '#0F172A', textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#F1F5F9' },
    bioText: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '600' },

    // Geometry
    tripleInputRow: { flexDirection: 'row', gap: 10 },
    radiusControl: { flexDirection: 'row', alignItems: 'flex-end', gap: 15, marginTop: 20 },
    syncAction: { flex: 1.5, height: 56, borderRadius: 14, overflow: 'hidden' },
    syncGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    syncText: { color: 'white', fontSize: 13, fontWeight: '900' },

    // Footer
    footerBar: { position: 'absolute', left: 25, right: 25, zIndex: 1000 },
    saveAction: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    saveGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    saveLabel: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
