import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Image,
    TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { agentApi, AgentJob } from '../../../lib/agent';
import { Button } from '../../../components/ui/Button';

export default function AgentJobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [job, setJob] = useState<AgentJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [proofImages, setProofImages] = useState<string[]>([]);
    const [otp, setOtp] = useState('');


    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsMultipleSelection: true,
                quality: 0.7,
            });

            if (!result.canceled) {
                setProofImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Error', 'Could not open image library');
        }
    };

    const removeImage = (uri: string) => {
        setProofImages(prev => prev.filter(i => i !== uri));
    };

    const fetchDetails = useCallback(async () => {
        try {
            const { data } = await agentApi.getJobDetails(id);
            setJob(data);
        } catch (error) {
            console.error('Error fetching job details:', error);
            Alert.alert('Error', 'Could not load job details');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleStatusUpdate = async (nextStatus: string) => {
        if (nextStatus === 'COMPLETED') {
            if (proofImages.length === 0) {
                Alert.alert('Proof of Work Required', 'Please add at least one image before completing the job.');
                return;
            }
            if (!otp || otp.length !== 6) {
                Alert.alert('OTP Required', 'Please enter the 6-digit completion code provided by the customer.');
                return;
            }
        }

        setUpdating(true);
        try {
            await agentApi.updateJobStatus(id, nextStatus, proofImages, otp);
            await fetchDetails();
            if (nextStatus === 'COMPLETED') {
                setOtp('');
                setProofImages([]);
            }
        } catch (error: any) {
            console.error('Status update failed:', error);
            const msg = error.response?.data?.error || 'Failed to update status';
            Alert.alert('Error', msg);
        } finally {
            setUpdating(false);
        }
    };

    const openMaps = () => {
        if (!job?.address) return;
        const { line1, city, latitude, longitude } = job.address;
        const query = encodeURIComponent(`${line1}, ${city}`);
        const url = Platform.select({
            ios: `maps:0,0?q=${query}&ll=${latitude},${longitude}`,
            android: `geo:${latitude},${longitude}?q=${query}`
        }) || `https://www.google.com/maps/search/?api=1&query=${query}`;

        Linking.openURL(url);
    };

    const renderActionButtons = () => {
        if (!job) return null;

        switch (job.status) {
            case 'ACCEPTED':
            case 'AGENT_ASSIGNED':
                return (
                    <View style={{ gap: Spacing.sm }}>
                        <Button
                            title="▶ Start Execution"
                            onPress={() => router.push(`/(agent)/jobs/${id}/execute` as any)}
                        />
                        <Button title="Mark En Route" onPress={() => handleStatusUpdate('EN_ROUTE')} loading={updating} />
                    </View>
                );
            case 'EN_ROUTE':
                return <Button title="I have Arrived" onPress={() => handleStatusUpdate('ARRIVED')} loading={updating} />;
            case 'ARRIVED':
                return <Button title="Start Job" onPress={() => handleStatusUpdate('IN_PROGRESS')} loading={updating} />;
            case 'IN_PROGRESS':
                return <Button title="Complete Job" onPress={() => handleStatusUpdate('COMPLETED')} loading={updating} variant="success" />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!job) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Job Details</Text>
                <TouchableOpacity
                    onPress={() => router.push(`/(agent)/chat/${id}`)}
                    style={styles.chatButton}
                >
                    <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Bar */}
                <View style={styles.statusSection}>
                    <Text style={styles.label}>Current Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '15' }]}>
                        <Text style={styles.statusText}>{job.status.replace('_', ' ')}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer</Text>
                    <View style={styles.card}>
                        <View style={styles.customerRow}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color={Colors.textMuted} />
                            </View>
                            <View style={styles.customerDetails}>
                                <Text style={styles.customerName}>{job.customer?.name || 'Customer'}</Text>
                                <Text style={styles.customerPhone}>{job.customer?.phone || 'No phone provided'}</Text>
                            </View>
                            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${job.customer?.phone}`)}>
                                <Ionicons name="call" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Location</Text>
                    <TouchableOpacity style={styles.card} onPress={openMaps}>
                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={24} color={Colors.primary} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLine}>{job.address?.line1}</Text>
                                <Text style={styles.addressSub}>{job.address?.city}, {job.address?.state} {job.address?.zipCode}</Text>
                            </View>
                            <Ionicons name="navigate-circle" size={32} color={Colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Services */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <View style={styles.card}>
                        {job.items.map((item, index) => (
                            <View key={item.id} style={[styles.serviceRow, index > 0 && styles.serviceDivider]}>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName}>{item.service?.name}</Text>
                                    <Text style={styles.serviceQty}>Qty: {item.quantity}</Text>
                                </View>
                                <Text style={styles.servicePrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Proof of Work Section */}
                {job.status === 'IN_PROGRESS' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Proof of Work</Text>
                        <View style={styles.card}>
                            <Text style={styles.helpText}>Add photos showing the completed work</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {proofImages.map((uri) => (
                                    <View key={uri} style={styles.imagePreviewWrapper}>
                                        <Image source={{ uri }} style={styles.imagePreview} />
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(uri)}>
                                            <Ionicons name="close-circle" size={20} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                    <Ionicons name="camera" size={32} color={Colors.primary} />
                                    <Text style={styles.addImageText}>Add Photo</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                )}

                {/* OTP Verification Section */}
                {job.status === 'IN_PROGRESS' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Verification</Text>
                        <View style={styles.card}>
                            <Text style={styles.helpText}>Enter the 6-digit code provided by the customer</Text>
                            <TextInput
                                style={styles.otpInput}
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="Enter 6-digit OTP"
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {renderActionButtons()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    chatButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { padding: Spacing.lg, paddingBottom: 100 },

    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        backgroundColor: Colors.backgroundAlt,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.xs, textTransform: 'uppercase' },

    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    card: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    customerRow: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.backgroundAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerDetails: { flex: 1, marginLeft: Spacing.md },
    customerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    customerPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center' },

    addressRow: { flexDirection: 'row', alignItems: 'center' },
    addressInfo: { flex: 1, marginLeft: Spacing.md },
    addressLine: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    addressSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing.sm },
    serviceDivider: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    serviceQty: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    servicePrice: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },

    helpText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
    imageScroll: { flexDirection: 'row' },
    imagePreviewWrapper: { marginRight: Spacing.sm },
    imagePreview: { width: 100, height: 100, borderRadius: BorderRadius.md },
    removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 10 },
    addImageBtn: { width: 100, height: 100, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundAlt, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    addImageText: { fontSize: 10, color: Colors.primary, fontWeight: '600', marginTop: 4 },

    otpInput: {
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.lg,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 8,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});
