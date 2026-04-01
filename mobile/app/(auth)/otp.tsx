import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { z } from 'zod';
import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { verifyOtpSchema } from '../../lib/validations/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
    const router = useRouter();
    const { phone, name, purpose } = useLocalSearchParams<{ phone: string; name?: string; purpose?: string }>();
    const { loginWithOtp, sendOtp: storeSendOtp, isLoading, error, clearError } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
    const [isSending, setIsSending] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        setResendTimer(RESEND_COOLDOWN);
    }, []);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleResend = async () => {
        if (!phone) return;
        setIsSending(true);
        try {
            await storeSendOtp({ phone });
            setResendTimer(RESEND_COOLDOWN);
            Alert.alert('Success', 'OTP resent successfully');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to resend OTP');
        } finally {
            setIsSending(false);
        }
    };

    const handleChange = (text: string, index: number) => {
        clearError();
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newOtp.every((digit) => digit.length === 1)) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        if (!phone) return;
        try {
            // Validate input
            verifyOtpSchema.parse({ phone, code, name });

            await loginWithOtp(phone, code, name);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                Alert.alert('Invalid Code', err.issues[0].message);
            } else {
                Alert.alert('Verification Failed', err.message);
            }
            setOtp(new Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + Spacing.xl }]}>
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} disabled={isLoading} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Text style={styles.title}>Verification</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to <Text style={styles.phoneHighlight}>+{phone}</Text>
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.formContainer}>
                            <View style={styles.otpWrapper}>
                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput key={index} ref={(ref) => { inputRefs.current[index] = ref; }}
                                            style={[styles.otpInput, digit ? styles.otpInputFilled : null, error ? styles.otpInputError : null,]}
                                            value={digit}
                                            onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
                                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            selectTextOnFocus
                                            autoFocus={index === 0}
                                            placeholderTextColor="#94A3B840"
                                            placeholder="0"
                                        />
                                    ))}
                                </View>
                            </View>

                            {!!error && <Text style={styles.errorText}>{error}</Text>}

                            <View style={styles.resendSection}>
                                {resendTimer > 0 ? (
                                    <View style={styles.timerRow}>
                                        <Ionicons name="time-outline" size={16} color="#64748B" />
                                        <Text style={styles.resendText}>
                                            Resend code in <Text style={styles.timerText}>{resendTimer}s</Text>
                                        </Text>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={handleResend}
                                        disabled={isSending}
                                        style={({ pressed }) => [
                                            styles.resendButton,
                                            pressed && { opacity: 0.7 }
                                        ]}
                                    >
                                        <Text style={styles.resendButtonText}>Resend OTP</Text>
                                    </Pressable>
                                )}
                            </View>

                            <View style={styles.spacer} />

                            <Button
                                title="Verify & Continue"
                                onPress={() => handleVerify(otp.join(''))}
                                disabled={otp.some(d => !d) || isLoading}
                                loading={isLoading}
                                style={styles.verifyBtn}
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Entered the wrong number?{' '}
                            <Text
                                style={styles.footerLink}
                                onPress={() => router.back()}
                            >
                                Change
                            </Text>
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    decoration: {
        position: 'absolute',
        borderRadius: 100,
    },
    decor1: {
        width: 250,
        height: 250,
        backgroundColor: Colors.primary + '08',
        top: -80,
        right: -80,
    },
    decor2: {
        width: 150,
        height: 150,
        backgroundColor: Colors.secondary + '08',
        bottom: '10%',
        left: -50,
    },
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.textDark,
        lineHeight: 46,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 12,
        lineHeight: 24,
        fontWeight: '600',
    },
    phoneHighlight: {
        color: Colors.primary,
        fontWeight: '800',
    },
    form: {
        width: '100%',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    otpWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    otpInput: {
        flex: 1,
        height: 58,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        padding: 10,
    },
    otpInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '03',
    },
    otpInputError: {
        borderColor: Colors.error,
        backgroundColor: Colors.error + '03',
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
    },
    resendSection: {
        alignItems: 'center',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resendText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    timerText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    resendButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    resendButtonText: {
        color: Colors.primary,
        fontWeight: '800',
        fontSize: 15,
    },
    spacer: {
        height: 24,
    },
    verifyBtn: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        paddingVertical: 20,
    },
    footerText: {
        color: '#64748B',
        fontSize: 15,
        fontWeight: '500',
    },
    footerLink: {
        color: Colors.primary,
        fontWeight: '800',
        fontSize: 15,
    },
});
