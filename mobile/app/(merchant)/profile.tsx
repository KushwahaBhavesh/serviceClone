import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { merchantApi, MerchantSettings } from '../../lib/merchant';
import { getImageUrl } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function MerchantProfileScreen() {
    const [settings, setSettings] = useState<MerchantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        businessName: '',
        description: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        logoUrl: '',
        coverImageUrl: '',
    });

    const fetchSettings = useCallback(async () => {
        try {
            const response = await merchantApi.getSettings();
            const s = response.data.settings;
            setSettings(s);
            setForm({
                businessName: s.businessName || '',
                description: s.description || '',
                phone: s.phone || '',
                address: s.address || '',
                city: s.city || '',
                state: s.state || '',
                zipCode: s.zipCode || '',
                logoUrl: s.logoUrl || '',
                coverImageUrl: s.coverImageUrl || '',
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);
    const onRefresh = () => { setRefreshing(true); fetchSettings(); };

    const handlePickImage = async (field: 'logoUrl' | 'coverImageUrl') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: field === 'logoUrl' ? [1, 1] : [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            try {
                const uploadRes = await merchantApi.uploadFile(result.assets[0].uri);
                setForm(p => ({ ...p, [field]: uploadRes.data.fileUrl }));
            } catch (error) {
                Alert.alert('Error', 'Failed to upload image');
            }
        }
    };

    const handleSave = async () => {
        try {
            await merchantApi.updateSettings(form);
            setEditing(false);
            fetchSettings();
            Alert.alert('Success', 'Settings updated');
        } catch {
            Alert.alert('Error', 'Failed to update settings');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    const verStatus = settings?.verificationStatus ?? 'NOT_SUBMITTED';
    const verColor = verStatus === 'APPROVED' ? '#10B981' : verStatus === 'REJECTED' ? Colors.error : '#F59E0B';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Header/Cover Section */}
                <View style={styles.coverWrapper}>
                    <TouchableOpacity
                        disabled={!editing}
                        onPress={() => handlePickImage('coverImageUrl')}
                        activeOpacity={0.8}
                    >
                        {form.coverImageUrl ? (
                            <Image source={{ uri: getImageUrl(form.coverImageUrl) || undefined }} style={styles.coverImage} />
                        ) : (
                            <View style={[styles.coverImage, styles.coverPlaceholder]}>
                                <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                                <Text style={styles.placeholderText}>No Cover Image</Text>
                            </View>
                        )}
                        {editing && (
                            <View style={styles.imageEditOverlay}>
                                <Ionicons name="camera" size={24} color="white" />
                                <Text style={styles.overlayText}>Change Cover</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Navbar actions */}
                    <View style={styles.navbar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.navCircle}>
                            <Ionicons name="arrow-back" size={20} color={Colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => editing ? handleSave() : setEditing(true)}
                            style={[styles.navCircle, editing && styles.saveBtnActive]}
                        >
                            <Ionicons name={editing ? "checkmark" : "pencil"} size={20} color={editing ? "white" : Colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Identity Section */}
                <View style={styles.identitySection}>
                    <View style={styles.logoWrapper}>
                        <TouchableOpacity
                            disabled={!editing}
                            onPress={() => handlePickImage('logoUrl')}
                            style={styles.logoOuter}
                        >
                            {form.logoUrl ? (
                                <Image source={{ uri: getImageUrl(form.logoUrl) || undefined }} style={styles.logoImage} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Ionicons name="business" size={32} color={Colors.primary} />
                                </View>
                            )}
                            {editing && (
                                <View style={styles.logoEditOverlay}>
                                    <Ionicons name="camera" size={16} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mainInfo}>
                        {editing ? (
                            <TextInput
                                style={styles.nameInput}
                                value={form.businessName}
                                onChangeText={(t) => setForm(p => ({ ...p, businessName: t }))}
                                placeholder="Business Name"
                            />
                        ) : (
                            <View style={styles.nameRow}>
                                <Text style={styles.businessName}>{settings?.businessName || 'Unnamed Business'}</Text>
                                {verStatus === 'APPROVED' && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                )}
                            </View>
                        )}
                        <View style={styles.badgeRow}>
                            <View style={[styles.statusBadge, { backgroundColor: verColor + '15' }]}>
                                <Ionicons name={verStatus === 'APPROVED' ? 'shield-checkmark' : 'alert-circle'} size={12} color={verColor} />
                                <Text style={[styles.statusText, { color: verColor }]}>{verStatus.replace('_', ' ')}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.ratingText}>{(settings?.rating ?? 0).toFixed(1)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.contentPadding}>
                    {/* Bio Section */}
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Business Bio</Text>
                        {editing ? (
                            <TextInput
                                style={styles.biographyInput}
                                value={form.description}
                                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
                                placeholder="Tell customers about your services..."
                                multiline
                            />
                        ) : (
                            <Text style={styles.biographyText}>
                                {settings?.description || 'No description provided yet. Add one to help customers find you.'}
                            </Text>
                        )}
                    </View>

                    {/* Contact Grid */}
                    <View style={styles.gridSection}>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                                <Ionicons name="call" size={20} color="#4F46E5" />
                            </View>
                            <View style={styles.gridText}>
                                <Text style={styles.gridLabel}>Phone Number</Text>
                                {editing ? (
                                    <TextInput
                                        style={styles.gridInput}
                                        value={form.phone}
                                        onChangeText={(t) => setForm(p => ({ ...p, phone: t }))}
                                        keyboardType="phone-pad"
                                    />
                                ) : (
                                    <Text style={styles.gridValue}>{settings?.phone || 'Not provided'}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.gridItem}>
                            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="location" size={20} color="#10B981" />
                            </View>
                            <View style={styles.gridText}>
                                <Text style={styles.gridLabel}>Business Location</Text>
                                {editing ? (
                                    <TextInput
                                        style={styles.gridInput}
                                        value={form.address}
                                        onChangeText={(t) => setForm(p => ({ ...p, address: t }))}
                                        placeholder="Address"
                                    />
                                ) : (
                                    <Text style={styles.gridValue} numberOfLines={1}>{settings?.address || 'Set address'}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Extended Location Fields (Only if editing) */}
                    {editing && (
                        <View style={styles.locationGroup}>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={form.city}
                                    onChangeText={(t) => setForm(p => ({ ...p, city: t }))}
                                    placeholder="City"
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={form.state}
                                    onChangeText={(t) => setForm(p => ({ ...p, state: t }))}
                                    placeholder="State"
                                />
                                <TextInput
                                    style={[styles.input, { width: 80 }]}
                                    value={form.zipCode}
                                    onChangeText={(t) => setForm(p => ({ ...p, zipCode: t }))}
                                    placeholder="Zip"
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    )}

                    {/* KYC Quick Check */}
                    <View style={styles.kycSection}>
                        <View style={styles.kycHeader}>
                            <Text style={styles.sectionTitle}>Verification Highlights</Text>
                            <TouchableOpacity onPress={() => router.push('/(merchant)/verification')}>
                                <Text style={styles.linkText}>View All Documents</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.kycStrip}>
                            {settings?.verificationDocs && settings.verificationDocs.length > 0 ? (
                                settings.verificationDocs.slice(0, 3).map((doc) => (
                                    <View key={doc.id} style={styles.kycChip}>
                                        {doc.fileUrl ? (
                                            <Image
                                                source={{ uri: getImageUrl(doc.fileUrl) || undefined }}
                                                style={styles.kycThumb}
                                            />
                                        ) : (
                                            <Ionicons
                                                name={doc.status === 'APPROVED' ? "checkmark-circle" : "time"}
                                                size={14}
                                                color={doc.status === 'APPROVED' ? "#10B981" : "#F59E0B"}
                                            />
                                        )}
                                        <Text style={styles.kycChipText}>{doc.type.replace('_', ' ')}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyKycText}>No verification documents found.</Text>
                            )}
                        </View>
                    </View>

                    {/* Action Footer */}
                    {!editing && verStatus !== 'APPROVED' && (
                        <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={() => router.push('/(merchant)/verification')}
                        >
                            <Text style={styles.verifyBtnText}>Complete Verification</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    coverWrapper: {
        height: 220,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    coverPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 4,
    },
    imageEditOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: 'white',
        fontSize: FontSize.xs,
        fontWeight: '700',
        marginTop: 4,
    },
    navbar: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    navCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveBtnActive: {
        backgroundColor: Colors.primary,
    },

    identitySection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: -40,
        alignItems: 'flex-end',
    },
    logoWrapper: {
        position: 'relative',
    },
    logoOuter: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: 'white',
        backgroundColor: 'white',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    logoEditOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    mainInfo: {
        flex: 1,
        marginLeft: Spacing.md,
        paddingBottom: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    businessName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    nameInput: {
        fontSize: 20,
        fontWeight: '700',
        borderBottomWidth: 1,
        borderColor: Colors.border,
        color: Colors.text,
        paddingVertical: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#92400E',
    },

    contentPadding: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    biographyText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    biographyInput: {
        fontSize: FontSize.sm,
        color: Colors.text,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
    },

    gridSection: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    gridItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridText: {
        flex: 1,
    },
    gridLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 2,
    },
    gridValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    gridInput: {
        fontSize: 13,
        fontWeight: '700',
        padding: 0,
        color: Colors.primary,
    },

    locationGroup: {
        marginBottom: 24,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },

    kycSection: {
        marginTop: 8,
    },
    kycHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    linkText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '700',
    },
    kycStrip: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    kycChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    kycThumb: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    kycChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    emptyKycText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },

    verifyBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: Spacing.xl,
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    verifyBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
