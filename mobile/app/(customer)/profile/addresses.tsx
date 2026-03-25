import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { customerApi, type Address } from '../../../lib/marketplace';
import { Button } from '../../../components/ui/Button';

export default function AddressBookScreen() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);
            await customerApi.createAddress(formData as any);
            setIsModalVisible(false);
            setFormData({ label: '', line1: '', city: '', state: '', zipCode: '', isDefault: false });
            fetchAddresses();
        } catch (err) {
            Alert.alert('Error', 'Failed to save address');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAddress = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await customerApi.deleteAddress(id);
                        fetchAddresses();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete address');
                    }
                }
            },
        ]);
    };

    const renderAddress = ({ item }: { item: Address }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressLeft}>
                <View style={[styles.labelBadge, { backgroundColor: item.isDefault ? Colors.primary + '15' : Colors.backgroundAlt }]}>
                    <Ionicons name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'briefcase' : 'location'} size={14} color={item.isDefault ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.labelText, { color: item.isDefault ? Colors.primary : Colors.text }]}>{item.label}</Text>
                </View>
                <Text style={styles.addressLine1}>{item.line1}</Text>
                <Text style={styles.addressLine2}>{item.city}, {item.state} {item.zipCode}</Text>
                {item.isDefault && <Text style={styles.defaultTag}>Default Address</Text>}
            </View>
            <View style={styles.addressActions}>
                <Pressable onPress={() => handleDeleteAddress(item.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Address Book</Text>
                <Pressable onPress={() => setIsModalVisible(true)} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </Pressable>
            </View>

            {isLoading && !isModalVisible ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="map-outline" size={64} color={Colors.border} />
                            <Text style={styles.emptyText}>No addresses saved yet</Text>
                            <Button
                                title="Add New Address"
                                onPress={() => setIsModalVisible(true)}
                                variant="outline"
                                style={{ marginTop: Spacing.lg }}
                            />
                        </View>
                    }
                />
            )}

            {/* Add Address Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Address</Text>
                            <Pressable onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Label (e.g. Home, Office)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.label}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
                                placeholder="Home"
                            />

                            <Text style={styles.inputLabel}>Address Line 1</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.line1}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, line1: text }))}
                                placeholder="Street address, P.O. box"
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: Spacing.md }}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.city}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                                        placeholder="City"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>State</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.state}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                                        placeholder="State"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Zip Code</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.zipCode}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
                                placeholder="6-digit ZIP"
                                keyboardType="numeric"
                            />

                            <Pressable
                                style={styles.checkboxRow}
                                onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                            >
                                <View style={[styles.checkbox, formData.isDefault && styles.checkboxActive]}>
                                    {formData.isDefault && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as default address</Text>
                            </Pressable>

                            <Button
                                title="Save Address"
                                onPress={handleAddAddress}
                                style={{ marginVertical: Spacing.xl }}
                                loading={isLoading}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        width: 48, height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    addBtn: {
        width: 44, height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    listContent: { padding: Spacing.lg },
    addressCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 24, // Consistent 24px grounding
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    addressLeft: { flex: 1 },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
        marginBottom: Spacing.sm,
    },
    labelText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    addressLine1: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    addressLine2: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    defaultTag: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginTop: Spacing.xs },
    addressActions: { justifyContent: 'center', paddingLeft: Spacing.md },
    actionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    formContainer: { padding: Spacing.lg },
    inputLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 56,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
    },
    row: { flexDirection: 'row' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.sm },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkboxLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
});
