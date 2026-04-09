import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';
import { agentApi, AgentJob } from '../../../../lib/agent';
import { Button } from '../../../../components/ui/Button';
import JobStepIndicator from '../../../../components/agent/JobStepIndicator';
import ChecklistItem from '../../../../components/agent/ChecklistItem';
import PhotoCaptureGrid from '../../../../components/agent/PhotoCaptureGrid';

// ─── Step Definitions ───

const EXECUTION_STEPS = [
    { label: 'En Route', icon: 'navigate' as const },
    { label: 'Arrived', icon: 'location' as const },
    { label: 'Working', icon: 'construct' as const },
    { label: 'Complete', icon: 'checkmark-circle' as const },
];

const DEFAULT_CHECKLIST = [
    'Safety check done',
    'Tools and equipment ready',
    'Customer briefed on service plan',
];

// Map booking status to step index
function statusToStep(status: string): number {
    switch (status) {
        case 'ACCEPTED':
        case 'AGENT_ASSIGNED':
            return 0;
        case 'EN_ROUTE':
            return 1;
        case 'ARRIVED':
        case 'IN_PROGRESS':
            return 2;
        case 'COMPLETED':
            return 3;
        default:
            return 0;
    }
}

export default function ExecuteJobScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [job, setJob] = useState<AgentJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1 – Arrived: before photos
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);

    // Step 2 – In Progress: checklist + after photos
    const [checklistItems, setChecklistItems] = useState<{ label: string; checked: boolean }[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
    const [arrivedDone, setArrivedDone] = useState(false); // "I've Arrived" sent, now capture before photo

    // Step 3 – Completion: OTP
    const [otp, setOtp] = useState('');
    const [otpAttempts, setOtpAttempts] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // ─── Persistence Key ───
    const storageKey = `job_execution_${id}`;

    // ─── Fetch Job ───
    const fetchJob = useCallback(async () => {
        try {
            const { data } = await agentApi.getJobDetails(id);
            setJob(data);

            const step = statusToStep(data.status);
            setCurrentStep(step);

            // If arrived and status is IN_PROGRESS, mark arrivedDone
            if (data.status === 'IN_PROGRESS') {
                setArrivedDone(true);
            }

            // Initialize checklist from service or defaults
            const items = DEFAULT_CHECKLIST.map((label) => ({ label, checked: false }));
            setChecklistItems(items);

            // Restore persisted state
            try {
                const saved = await AsyncStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.beforePhotos) setBeforePhotos(parsed.beforePhotos);
                    if (parsed.afterPhotos) setAfterPhotos(parsed.afterPhotos);
                    if (parsed.checklistItems) setChecklistItems(parsed.checklistItems);
                    if (parsed.arrivedDone) setArrivedDone(parsed.arrivedDone);
                }
            } catch { }
        } catch (error) {
            console.error('Error fetching job:', error);
            Alert.alert('Error', 'Could not load job details');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    // ─── Persist State ───
    useEffect(() => {
        if (!job) return;
        const state = { beforePhotos, afterPhotos, checklistItems, arrivedDone };
        AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => { });
    }, [beforePhotos, afterPhotos, checklistItems, arrivedDone]);

    // ─── Status Update ───
    const updateStatus = async (nextStatus: string, extras?: { proofOfWorkUrls?: string[]; otp?: string }) => {
        setUpdating(true);
        try {
            await agentApi.updateJobStatus(id, nextStatus, extras?.proofOfWorkUrls, extras?.otp);
            await fetchJob();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to update status';
            Alert.alert('Error', msg);

            if (nextStatus === 'COMPLETED' && msg.toLowerCase().includes('otp')) {
                setOtpAttempts((prev) => prev + 1);
            }
        } finally {
            setUpdating(false);
        }
    };

    // ─── Open Maps ───
    const openMaps = () => {
        if (!job?.address) return;
        const { line1, city, latitude, longitude } = job.address;
        const query = encodeURIComponent(`${line1}, ${city}`);
        const url =
            Platform.select({
                ios: `maps:0,0?q=${query}&ll=${latitude},${longitude}`,
                android: `geo:${latitude},${longitude}?q=${query}`,
            }) || `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url);
    };

    // ─── Toggle Checklist ───
    const toggleChecklist = (index: number) => {
        setChecklistItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
        );
    };

    const allChecked = checklistItems.every((item) => item.checked);

    // ─── Completion Handler ───
    const handleComplete = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('OTP Required', 'Please enter the 4-digit code from the customer.');
            return;
        }
        if (afterPhotos.length === 0) {
            Alert.alert('Photos Required', 'Please upload at least one completion photo.');
            return;
        }

        await updateStatus('COMPLETED', {
            proofOfWorkUrls: [...beforePhotos, ...afterPhotos],
            otp,
        });

        // Check if update succeeded
        const { data: refreshed } = await agentApi.getJobDetails(id);
        if (refreshed.status === 'COMPLETED') {
            setShowSuccess(true);
            await AsyncStorage.removeItem(storageKey);
            setTimeout(() => {
                router.replace('/(agent)/(tabs)/jobs' as any);
            }, 3000);
        }
    };

    // ─── Loading / Read-only ───
    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!job) return null;

    // Completed read-only
    if (job.status === 'COMPLETED' || showSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </Pressable>
                    <Text style={styles.title}>Job Completed</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.successContent}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark-circle" size={72} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>JOB COMPLETED</Text>
                    <Text style={styles.successSub}>
                        Great work! The customer has been notified.
                    </Text>
                    {job.total && (
                        <View style={styles.earningsCard}>
                            <Text style={styles.earningsLabel}>EARNINGS</Text>
                            <Text style={styles.earningsValue}>
                                ₹{job.total?.toFixed(0) || '0'}
                            </Text>
                        </View>
                    )}
                    <Pressable
                        style={styles.backToJobsBtn}
                        onPress={() => router.replace('/(agent)/(tabs)/jobs' as any)}
                    >
                        <Text style={styles.backToJobsText}>Back to Jobs</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Main Execution Flow ───
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>Job Execution</Text>
                <Pressable
                    onPress={() => router.push(`/(agent)/chat/${id}` as any)}
                    style={styles.chatBtn}
                >
                    <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <JobStepIndicator currentStep={currentStep} steps={EXECUTION_STEPS} />

                {/* ─── STEP 0: En Route ─── */}
                {currentStep === 0 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Navigate to Customer</Text>

                        <Pressable style={styles.addressCard} onPress={openMaps}>
                            <Ionicons name="location" size={24} color={Colors.primary} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLine}>{job.address?.line1}</Text>
                                <Text style={styles.addressSub}>
                                    {job.address?.city}, {job.address?.state} {job.address?.zipCode}
                                </Text>
                            </View>
                            <Ionicons name="navigate-circle" size={32} color={Colors.primary} />
                        </Pressable>

                        <View style={styles.customerCard}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color={Colors.textMuted} />
                            </View>
                            <View style={{ flex: 1, marginLeft: Spacing.md }}>
                                <Text style={styles.customerName}>{job.customer?.name || 'Customer'}</Text>
                                <Text style={styles.customerPhone}>{job.customer?.phone || 'No phone'}</Text>
                            </View>
                            <Pressable
                                style={styles.callBtn}
                                onPress={() => Linking.openURL(`tel:${job.customer?.phone}`)}
                            >
                                <Ionicons name="call" size={20} color={Colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ─── STEP 1: Arrived ─── */}
                {currentStep === 1 && (
                    <View style={styles.stepContainer}>
                        {!arrivedDone ? (
                            <>
                                <Text style={styles.stepTitle}>Confirm Arrival</Text>
                                <Text style={styles.helpText}>
                                    Tap the button below when you have arrived at the customer's location.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.stepTitle}>Capture Before Photo</Text>
                                <Text style={styles.helpText}>
                                    Take a photo of the area before starting work. This serves as documentation.
                                </Text>
                                <PhotoCaptureGrid
                                    photos={beforePhotos}
                                    onAdd={(uris) => setBeforePhotos((prev) => [...prev, ...uris])}
                                    onRemove={(uri) => setBeforePhotos((prev) => prev.filter((p) => p !== uri))}
                                    maxPhotos={3}
                                    label="Before Photos"
                                    useCamera
                                />
                            </>
                        )}
                    </View>
                )}

                {/* ─── STEP 2: In Progress ─── */}
                {currentStep === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Service Checklist</Text>
                        <Text style={styles.helpText}>
                            Complete all checklist items and upload after-work photos.
                        </Text>

                        <View style={styles.checklistSection}>
                            {checklistItems.map((item, index) => (
                                <ChecklistItem
                                    key={item.label}
                                    label={item.label}
                                    checked={item.checked}
                                    onToggle={() => toggleChecklist(index)}
                                />
                            ))}
                        </View>

                        <PhotoCaptureGrid
                            photos={afterPhotos}
                            onAdd={(uris) => setAfterPhotos((prev) => [...prev, ...uris])}
                            onRemove={(uri) => setAfterPhotos((prev) => prev.filter((p) => p !== uri))}
                            maxPhotos={5}
                            label="After Photos (Proof of Work)"
                            useCamera
                        />
                    </View>
                )}

                {/* ─── STEP 3: Completion (OTP) — shown when step 2 is complete ─── */}
                {currentStep === 2 && allChecked && afterPhotos.length > 0 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Customer Verification</Text>
                        <Text style={styles.helpText}>
                            Ask the customer for their 4-digit verification code.
                        </Text>

                        <TextInput
                            style={styles.otpInput}
                            value={otp}
                            onChangeText={setOtp}
                            placeholder="• • • •"
                            keyboardType="number-pad"
                            maxLength={4}
                            placeholderTextColor={Colors.textMuted}
                        />

                        {otpAttempts >= 3 && (
                            <View style={styles.otpErrorBox}>
                                <Ionicons name="warning" size={18} color="#EF4444" />
                                <Text style={styles.otpErrorText}>
                                    Too many wrong attempts. Please contact support.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ─── Footer Action Button ─── */}
            <View style={styles.footer}>
                {currentStep === 0 && (
                    <Button
                        title="I'm On My Way"
                        onPress={() => updateStatus('EN_ROUTE')}
                        loading={updating}
                    />
                )}

                {currentStep === 1 && !arrivedDone && (
                    <Button
                        title="I've Arrived"
                        onPress={async () => {
                            await updateStatus('ARRIVED');
                            setArrivedDone(true);
                        }}
                        loading={updating}
                    />
                )}

                {currentStep === 1 && arrivedDone && (
                    <Button
                        title="Start Job"
                        onPress={() => updateStatus('IN_PROGRESS')}
                        loading={updating}
                        disabled={beforePhotos.length === 0}
                    />
                )}

                {currentStep === 2 && (
                    <Button
                        title="Complete Job"
                        onPress={handleComplete}
                        loading={updating}
                        disabled={!allChecked || afterPhotos.length === 0 || otp.length < 4 || otpAttempts >= 3}
                        variant="success"
                    />
                )}
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
    chatBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },

    content: { padding: Spacing.lg, paddingBottom: 120 },

    stepContainer: { marginBottom: Spacing.xl },
    stepTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    helpText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },

    // Address Card
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    addressInfo: { flex: 1, marginLeft: Spacing.md },
    addressLine: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    addressSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

    // Customer Card
    customerCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.backgroundAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    customerPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Checklist
    checklistSection: { marginBottom: Spacing.lg },

    // OTP
    otpInput: {
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 12,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    otpErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    otpErrorText: {
        flex: 1,
        fontSize: FontSize.xs,
        color: '#EF4444',
        fontWeight: '600',
    },

    // Footer
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

    // Success Screen
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#10B98110',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 1.5,
        marginBottom: Spacing.sm,
    },
    successSub: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    earningsCard: {
        backgroundColor: '#10B98110',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
        width: '100%',
        borderWidth: 1,
        borderColor: '#10B98130',
    },
    earningsLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    earningsValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#10B981',
    },
    backToJobsBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
    },
    backToJobsText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
