import { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { z } from 'zod';
import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { loginSchema } from '../../lib/validations/auth';
import { COUNTRIES, Country } from '../../constants/countries';
import { CountrySelector } from '../../components/ui/CountrySelector';
import { AuthDecorations } from '../../components/ui/AuthDecorations';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../lib/auth';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showError } = useToast();
    const { sendOtp, isLoading: isAuthLoading, error, clearError } = useAuthStore();

    const [isChecking, setIsChecking] = useState(false);
    const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Default to India
    const [phone, setPhone] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ phone?: string }>({});

    const handleSendOtp = async () => {
        try {
            // Validate input
            loginSchema.parse({ phone });
            setFieldErrors({});

            clearError();
            const fullPhone = `${country.callingCode}${phone}`;
            
            // Bloom Filter Check
            setIsChecking(true);
            try {
                const { data } = await authApi.checkPhone(fullPhone);
                if (!data.exists) {
                    showError('Phone number not registered. Please sign up first.');
                    setIsChecking(false);
                    return;
                }
            } catch (err) {
                // If filter check fails, we proceed to OTP (conservative)
                console.warn('Bloom filter check failed:', err);
            } finally {
                setIsChecking(false);
            }

            await sendOtp({ phone: fullPhone });
            router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                const errors: any = {};
                err.issues.forEach((e) => {
                    if (e.path[0]) errors[e.path[0]] = e.message;
                });
                setFieldErrors(errors);
            } else {
                Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.bgContainer}>
                <AuthDecorations />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.scrollContent, { paddingTop: insets.top + 40 }]} >
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Text style={styles.title}>Welcome <Text style={styles.titleHighlight}>Back!</Text></Text>
                        <Text style={styles.subtitle}>Sign in to continue your journey with Nexus.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.formContainer}>
                            <Input
                                label="Phone Number"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChangeText={setPhone}
                                error={fieldErrors.phone}
                                keyboardType="number-pad"
                                maxLength={10}
                                leftIcon={<Ionicons name="call-outline" size={20} color={Colors.primary} />}
                                prefix={<CountrySelector onSelect={setCountry} selectedCountry={country} />}
                            />

                            <View style={styles.spacer} />

                            <Button
                                title="Send Verification Code"
                                onPress={handleSendOtp}
                                loading={isAuthLoading || isChecking}
                                style={styles.loginBtn}
                            />
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.line} />
                        </View>

                        <View style={styles.socialGrid}>
                            <Pressable style={styles.socialBtn}>
                                <Ionicons name="logo-google" size={24} color="#EA4335" />
                                <Text style={styles.socialBtnText}>Google</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Don't have an account?{' '}
                            <Text
                                style={styles.footerLink}
                                onPress={() => router.push('/(auth)/register')}
                            >
                                Register
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.textDark,
        lineHeight: 46,
        letterSpacing: -1,
    },
    titleHighlight: {
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 12,
        lineHeight: 24,
        fontWeight: '600',
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
    prefix: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    spacer: {
        height: 20,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginVertical: 18,
    },
    forgotPasswordText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    loginBtn: {
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 40,
    },
    line: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        marginHorizontal: 15,
        color: Colors.textMuted,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    socialGrid: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
    },
    socialBtn: {
        flex: 1,
        height: 58,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    socialBtnText: {
        color: '#1E293B',
        fontWeight: '700',
        fontSize: 16,
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
