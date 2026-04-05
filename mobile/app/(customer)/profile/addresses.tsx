import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    Modal,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
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
    ChevronLeft, 
    Plus, 
    MapPin, 
    Home, 
    Briefcase, 
    Trash2, 
    Check, 
    Sparkles, 
    Map as MapIcon,
    X,
    Navigation,
    ShieldCheck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { customerApi, type Address } from '../../../lib/marketplace';
import { useToast } from '../../../context/ToastContext';
import { Input } from '../../../components/ui/Input';

export default function AddressBookScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();
    
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        line1: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
    });

    const fetchAddresses = useCallback(async () => {
        try {
            const { data } = await customerApi.listAddresses();
            setAddresses(data.addresses);
        } catch (err) {
            console.error('Failed to fetch addresses:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleAddAddress = async () => {
        if (!formData.label || !formData.line1 || !formData.city) {
            showInfo('Please fill in all required fields');
            return;
        }

        try {
            setIsSaving(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await customerApi.createAddress(formData as any);
            setIsModalVisible(false);
            setFormData({ label: '', line1: '', city: '', state: '', zipCode: '', isDefault: false });
            showSuccess('Address successfully registered.');
            fetchAddresses();
        } catch (err) {
            showError('Failed to save infrastructure point.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await customerApi.deleteAddress(id);
            showSuccess('Address terminated.');
            fetchAddresses();
        } catch (err) {
            showError('Failed to delete address.');
        }
    };

    const renderAddress = ({ item, index }: { item: Address, index: number }) => {
        const Icon = item.label === 'Home' ? Home : item.label === 'Work' ? Briefcase : MapPin;
        
        return (
            <Animated.View entering={FadeInUp.delay(100 + index * 50).springify()}>
                <View style={[styles.addressCard, item.isDefault && styles.addressCardDefault]}>
                    <View style={styles.addressLeft}>
                        <View style={[styles.labelRow]}>
                            <View style={[styles.labelBadge, { backgroundColor: item.isDefault ? Colors.primary + '15' : '#F1F5F9' }]}>
                                <Icon size={14} color={item.isDefault ? Colors.primary : '#64748B'} strokeWidth={2.5} />
                                <Text style={[styles.labelText, { color: item.isDefault ? Colors.primary : '#475569' }]}>{item.label.toUpperCase()}</Text>
                            </View>
                            {item.isDefault && (
                                <View style={styles.defaultIndicator}>
                                    <ShieldCheck size={10} color={Colors.primary} strokeWidth={3} />
                                    <Text style={styles.defaultIndicatorText}>PRIMARY BASE</Text>
                                </View>
                            )}
                        </View>
                        
                        <Text style={styles.addressLine1}>{item.line1}</Text>
                        <Text style={styles.addressLine2}>{item.city}, {item.state} {item.zipCode}</Text>
                    </View>
                    
                    <View style={styles.addressActions}>
                        <Pressable 
                            onPress={() => handleDeleteAddress(item.id)} 
                            style={({ pressed }) => [
                                styles.actionBtn,
                                pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                            ]}
                        >
                            <Trash2 size={20} color="#EF4444" strokeWidth={2} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        );
    };

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
                        <Text style={styles.headerTitle}>ADDRESS BOOK</Text>
                        <Text style={styles.headerSubtitle}>Deployment Bases</Text>
                    </View>
                    <Animated.View entering={FadeInRight} style={styles.oracleBadge}>
                        <Sparkles size={12} color={Colors.primary} strokeWidth={3} />
                        <Text style={styles.oracleBadgeText}>ORACLE</Text>
                    </Animated.View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingTop: insets.top + 80, paddingBottom: 120 }
                    ]}
                    ListEmptyComponent={
                        <Animated.View entering={FadeInDown} style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Navigation size={48} color="#CBD5E1" strokeWidth={1} />
                            </View>
                            <Text style={styles.emptyText}>NO SAVED BASES</Text>
                            <Text style={styles.emptySubText}>Add your primary deployment locations.</Text>
                            <Pressable 
                                onPress={() => setIsModalVisible(true)}
                                style={styles.emptyAddBtn}
                            >
                                <Plus size={20} color="#FFF" strokeWidth={3} />
                                <Text style={styles.emptyAddBtnText}>NEW BASE</Text>
                            </Pressable>
                        </Animated.View>
                    }
                />
            )}

            {/* Floating Action Button */}
            {!isLoading && addresses.length > 0 && (
                <Animated.View 
                    entering={FadeInDown.delay(500)}
                    style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}
                >
                    <Pressable 
                        onPress={() => setIsModalVisible(true)}
                        style={({ pressed }) => [
                            styles.fab,
                            pressed && { transform: [{ scale: 0.95 }] }
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#FF7A00']}
                            style={styles.fabGradient}
                        >
                            <Plus size={28} color="#FFF" strokeWidth={3} />
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            )}

            {/* Add Address Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContentWrapper}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalDragHandle} />
                            <View style={styles.modalHeader}>
                                <View style={styles.modalHeaderInfo}>
                                    <Text style={styles.modalTitle}>NEW LOCATION</Text>
                                    <View style={styles.modalHeaderRow}>
                                        <MapIcon size={12} color={Colors.primary} />
                                        <Text style={styles.modalSubtitle}>Infrastructure Entry</Text>
                                    </View>
                                </View>
                                <Pressable onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                                    <X size={20} color="#64748B" strokeWidth={2.5} />
                                </Pressable>
                            </View>

                            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                                <View style={styles.bentoSection}>
                                    <View style={styles.inputCard}>
                                        <Text style={styles.inputLabel}>LABEL NAME</Text>
                                        <Input
                                            value={formData.label}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
                                            placeholder="e.g. Home, HQ"
                                            containerStyle={styles.inputInner}
                                            style={styles.textInput}
                                        />
                                    </View>

                                    <View style={styles.inputCard}>
                                        <Text style={styles.inputLabel}>ADDRESS LINE 1</Text>
                                        <Input
                                            value={formData.line1}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, line1: text }))}
                                            placeholder="Street coordinates"
                                            containerStyle={styles.inputInner}
                                            style={styles.textInput}
                                        />
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={[styles.inputCard, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>CITY</Text>
                                            <Input
                                                value={formData.city}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                                                placeholder="Zone"
                                                containerStyle={styles.inputInner}
                                                style={styles.textInput}
                                            />
                                        </View>
                                        <View style={[styles.inputCard, { width: 100 }]}>
                                            <Text style={styles.inputLabel}>STATE</Text>
                                            <Input
                                                value={formData.state}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                                                placeholder="ST"
                                                containerStyle={styles.inputInner}
                                                style={styles.textInput}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputCard}>
                                        <Text style={styles.inputLabel}>ZIP CODE</Text>
                                        <Input
                                            value={formData.zipCode}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
                                            placeholder="6-Digit Code"
                                            keyboardType="numeric"
                                            containerStyle={styles.inputInner}
                                            style={styles.textInput}
                                        />
                                    </View>

                                    <Pressable
                                        style={styles.checkboxRow}
                                        onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                                    >
                                        <View style={[styles.checkbox, formData.isDefault && styles.checkboxActive]}>
                                            {formData.isDefault && <Check size={14} color="white" strokeWidth={4} />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>SET AS PRIMARY BASE</Text>
                                    </Pressable>
                                </View>

                                <Pressable
                                    onPress={handleAddAddress}
                                    disabled={isSaving}
                                    style={({ pressed }) => [
                                        styles.saveBtn,
                                        pressed && { transform: [{ scale: 0.98 }] },
                                        isSaving && { opacity: 0.7 }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, '#FF7A00']}
                                        style={styles.saveGradient}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <>
                                                <Check size={20} color="#FFF" strokeWidth={3} />
                                                <Text style={styles.saveBtnText}>COMMIT DATA</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Sticky Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    listContent: { paddingHorizontal: 20 },

    // Address Cards
    addressCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
    addressCardDefault: { borderColor: Colors.primary + '30', backgroundColor: '#FFF' },
    addressLeft: { flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    labelText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    defaultIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    defaultIndicatorText: { fontSize: 8, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    addressLine1: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
    addressLine2: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 4 },
    addressActions: { justifyContent: 'center', paddingLeft: 15 },
    actionBtn: { width: 44, height: 44, backgroundColor: '#FEF2F2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FEE2E2' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 14, fontWeight: '900', color: '#64748B', letterSpacing: 1.5 },
    emptySubText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 8, textAlign: 'center' },
    emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primary, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 24, marginTop: 30, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    emptyAddBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    // FAB
    fabContainer: { position: 'absolute', right: 25, zIndex: 99 },
    fab: { width: 64, height: 64, borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
    fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContentWrapper: { width: '100%' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 40, paddingHorizontal: 25 },
    modalDragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 15, marginBottom: 10 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    modalHeaderInfo: { flex: 1 },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    modalSubtitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    closeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    formContainer: { maxHeight: '70%' },
    bentoSection: { gap: 16, marginBottom: 25 },
    inputCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 4, marginLeft: 4 },
    inputInner: { borderWidth: 0, paddingHorizontal: 4, marginBottom: 0, height: 40, backgroundColor: 'transparent' },
    textInput: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    inputRow: { flexDirection: 'row', gap: 12 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 12, paddingHorizontal: 5 },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkboxLabel: { fontSize: 12, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },

    saveBtn: { borderRadius: 24, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, marginTop: 10 },
    saveGradient: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
