import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    TextInput, ActivityIndicator, Alert, Dimensions,
    KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, SlideInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import {
    ChevronLeft, CreditCard, Landmark,
    Wallet, History, Check, ShieldCheck,
    Info, Save, ArrowDownLeft, ArrowUpRight,
    Calendar, RefreshCw, Smartphone, Building,
    Search, X, ChevronRight,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import { useToast } from '../../context/ToastContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MAJOR_BANKS = [
    'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs',
    'Morgan Stanley', 'U.S. Bancorp', 'PNC Financial Services', 'Truist Financial',
    'Capital One', 'TD Bank', 'Bank of New York Mellon', 'State Street Corporation',
    'American Express', 'Citizens Financial Group', 'First Republic Bank',
    'HSBC Bank USA', 'SVB Financial Group', 'Fifth Third Bancorp', 'BMO Harris Bank',
];

type PayoutFreq = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

export default function PayoutSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showSuccess } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [balance, setBalance] = useState('4,250.00');
    const [frequency, setFrequency] = useState<PayoutFreq>('WEEKLY');
    
    const [form, setForm] = useState({
        accountHolder: '',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        iban: '',
    });

    // Bank Selector State
    const [showBankModal, setShowBankModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBanks = useMemo(() => {
        return MAJOR_BANKS.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
            setSaving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSuccess('Bank details and payout schedule secured.');
        }, 1500);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Payout Settings</Text>
                    <View style={styles.headerRight} />
                </View>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 150, paddingTop: insets.top + 70 }}
                >
                    {/* ─── Wallet Insight Hero ─── */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroBox}>
                        <LinearGradient
                            colors={[Colors.primary, '#FF7A00']}
                            style={styles.heroGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.heroTop}>
                                <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
                                <Wallet size={24} color="rgba(255,255,255,0.8)" />
                            </View>
                            <Text style={styles.balanceText}>${balance}</Text>
                            <View style={styles.heroFooter}>
                                <View style={styles.statusPill}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>VERIFIED MERCHANT</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* ─── Section: Bank Integration ─── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.boxIndicator} />
                            <Text style={styles.sectionTitle}>BANK INTEGRATION</Text>
                        </View>
                        
                        <View style={styles.formCard}>
                            <FinanceField 
                                label="ACCOUNT HOLDER NAME" 
                                value={form.accountHolder} 
                                onChange={(t: string) => setForm(p => ({...p, accountHolder: t}))}
                                placeholder="Legal Entity Name"
                                icon={<Landmark size={18} color="#94A3B8" />}
                            />
                            <View style={styles.fieldGap} />
                            
                            {/* Executive Bank Selector Dropdown */}
                            <Text style={styles.fieldLabel}>INSTITUTION NAME</Text>
                            <Pressable 
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowBankModal(true);
                                }}
                                style={({ pressed }) => [
                                    styles.selectorBox,
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <View style={styles.selectorLeft}>
                                    <Building size={18} color="#94A3B8" />
                                    <Text style={[styles.selectorText, !form.bankName && { color: '#CBD5E1' }]} numberOfLines={1}>
                                        {form.bankName || 'Select your bank'}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </Pressable>

                            <View style={styles.fieldGap} />
                            <FinanceField 
                                label="ACCOUNT NUMBER / IBAN" 
                                value={form.accountNumber} 
                                onChange={(t: string) => setForm(p => ({...p, accountNumber: t}))}
                                placeholder="•••• •••• •••• 1234"
                                icon={<CreditCard size={18} color="#94A3B8" />}
                                secure
                            />
                        </View>
                    </View>

                    {/* ─── Section: Payout Strategy ─── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.boxIndicator} />
                            <Text style={styles.sectionTitle}>PAYOUT FREQUENCY</Text>
                        </View>
                        
                        <View style={styles.freqRow}>
                            <FreqCard 
                                label="WEEKLY" 
                                active={frequency === 'WEEKLY'} 
                                onPress={() => setFrequency('WEEKLY')} 
                                desc="Every Monday"
                            />
                            <FreqCard 
                                label="MONTHLY" 
                                active={frequency === 'MONTHLY'} 
                                onPress={() => setFrequency('MONTHLY')} 
                                desc="1st of Month"
                            />
                        </View>
                    </View>

                    {/* ─── Recent History ─── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.boxIndicator} />
                            <Text style={styles.sectionTitle}>RECENT TRANSFERS</Text>
                        </View>
                        <View style={styles.historyStack}>
                            <HistoryItem amount="1,240.00" date="Oct 24, 2024" status="PAID" />
                            <HistoryItem amount="850.50" date="Oct 17, 2024" status="PAID" />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ─── Bank Selector Modal ─── */}
            <Modal
                visible={showBankModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBankModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View entering={SlideInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalTitle}>Select Institution</Text>
                                <Pressable onPress={() => setShowBankModal(false)} style={styles.closeBtn}>
                                    <X size={20} color="#64748B" />
                                </Pressable>
                            </View>
                            
                            <View style={styles.searchContainer}>
                                <Search size={18} color="#94A3B8" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search banks..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        </View>

                        <FlatList
                            data={filteredBanks}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setForm(p => ({ ...p, bankName: item }));
                                        setShowBankModal(false);
                                        setSearchQuery('');
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    style={({ pressed }) => [
                                        styles.bankItem,
                                        pressed && { backgroundColor: '#F8FAFC' }
                                    ]}
                                >
                                    <View style={styles.bankIcon}>
                                        <Landmark size={20} color="#64748B" />
                                    </View>
                                    <View style={styles.bankInfo}>
                                        <Text style={styles.bankNameText}>{item}</Text>
                                        <Text style={styles.bankSub}>Institutional Partner</Text>
                                    </View>
                                    {form.bankName === item && <Check size={18} color={Colors.primary} strokeWidth={3} />}
                                </Pressable>
                            )}
                            contentContainerStyle={styles.bankListScroll}
                        />
                    </Animated.View>
                </View>
            </Modal>

            {/* ─── Persistent Save ─── */}
            <Animated.View entering={SlideInDown.springify()} style={[styles.fabWrapper, { bottom: insets.bottom + 20 }]}>
                <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    style={({ pressed }) => [
                        styles.saveBtn,
                        pressed && { transform: [{ scale: 0.98 }] },
                        saving && { opacity: 0.8 }
                    ]}
                >
                    <LinearGradient colors={[Colors.primary, '#FF7A00']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {saving ? <ActivityIndicator color="white" /> : (
                            <>
                                <ShieldCheck size={22} color="white" strokeWidth={2.5} />
                                <Text style={styles.saveLabel}>SECURE BANK SETTINGS</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </View>
    );
}

function FinanceField({ label, value, onChange, placeholder, icon, secure }: any) {
    const focus = useSharedValue(0);
    const boxStyle = useAnimatedStyle(() => ({
        borderColor: withSpring(focus.value ? Colors.primary : '#F1F5F9'),
        backgroundColor: withSpring(focus.value ? '#FFF9F5' : '#F8FAFC'),
    }));

    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Animated.View style={[styles.fieldOuter, boxStyle]}>
                {icon && <View style={styles.fieldIcon}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    onFocus={() => { focus.value = 1; }}
                    onBlur={() => { focus.value = 0; }}
                    secureTextEntry={secure}
                />
            </Animated.View>
        </View>
    );
}

function FreqCard({ label, active, onPress, desc }: any) {
    return (
        <Pressable onPress={onPress} style={[styles.freqCard, active && styles.freqCardActive]}>
            <View style={[styles.freqRadio, active && styles.freqRadioActive]}>{active && <View style={styles.freqInner} />}</View>
            <Text style={[styles.freqLabel, active && styles.freqLabelActive]}>{label}</Text>
            <Text style={styles.freqDesc}>{desc}</Text>
        </Pressable>
    );
}

function HistoryItem({ amount, date, status }: any) {
    return (
        <View style={styles.historyItem}>
            <View style={styles.historyLeft}>
                <View style={styles.historyIcon}>
                    <ArrowDownLeft size={18} color={Colors.primary} />
                </View>
                <View>
                    <Text style={styles.historyAmount}>${amount}</Text>
                    <Text style={styles.historyDate}>{date}</Text>
                </View>
            </View>
            <View style={styles.historyStatus}>
                <Text style={styles.statusTextSmall}>{status}</Text>
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
    headerRight: { width: 42 },

    // Hero
    heroBox: { paddingHorizontal: 25, marginTop: 10 },
    heroGradient: { borderRadius: 32, padding: 30, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 25, elevation: 12 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    heroLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
    balanceText: { fontSize: 38, fontWeight: '900', color: 'white', letterSpacing: -1 },
    heroFooter: { marginTop: 25 },
    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
    statusText: { fontSize: 10, fontWeight: '900', color: 'white' },

    // Sections
    section: { paddingHorizontal: 25, marginTop: 35 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    boxIndicator: { width: 6, height: 16, borderRadius: 3, backgroundColor: Colors.primary },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 },

    // Fields
    fieldWrapper: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', letterSpacing: 1, marginBottom: 10, marginLeft: 2 },
    fieldOuter: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 14, paddingHorizontal: 15, borderWidth: 1.5 },
    fieldIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
    fieldGap: { height: 20 },

    // Selector Box
    selectorBox: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#F1F5F9', justifyContent: 'space-between' },
    selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    selectorText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: SCREEN_H * 0.8, shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 20 },
    modalHeader: { padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, height: 50 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },
    bankListScroll: { paddingHorizontal: 25, paddingVertical: 10 },
    bankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    bankIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    bankInfo: { flex: 1 },
    bankNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    bankSub: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

    // History
    historyStack: { gap: 12 },
    historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
    historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    historyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    historyAmount: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
    historyDate: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    historyStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F0FDF4' },
    statusTextSmall: { fontSize: 10, fontWeight: '900', color: '#16A34A' },
    freqRow: { flexDirection: 'row', gap: 15 },
    freqCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#F1F5F9' },
    freqCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF9F5' },
    freqRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
    freqRadioActive: { borderColor: Colors.primary },
    freqInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    freqLabel: { fontSize: 15, fontWeight: '900', color: '#64748B', marginBottom: 4 },
    freqLabelActive: { color: Colors.primary },
    freqDesc: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

    // FAB
    fabWrapper: { position: 'absolute', left: 25, right: 25, zIndex: 1000 },
    saveBtn: { height: 70, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 15 },
    saveGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    saveLabel: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
