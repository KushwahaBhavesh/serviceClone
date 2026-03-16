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
import { registerSchema } from '../../lib/validations/auth';
import { COUNTRIES, Country } from '../../constants/countries';
import { CountrySelector } from '../../components/ui/CountrySelector';

export default function RegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sendOtp, isLoading, error, clearError } = useAuthStore();

    const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Default to India
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ name?: string, phone?: string }>({});

    const handleRegister = async () => {
        try {
            // Validate input
            registerSchema.parse({ name, phone });
            setFieldErrors({});

            clearError();
            const fullPhone = `${country.callingCode}${phone}`;
            await sendOtp({ phone: fullPhone });
            router.push({
                pathname: '/(auth)/otp',
                params: { phone: fullPhone, name, purpose: 'register' }
            });
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                const errors: any = {};
                err.issues.forEach((e) => {
                    if (e.path[0]) errors[e.path[0]] = e.message;
                });
                setFieldErrors(errors);
            } else {
                Alert.alert('Error', err.message || 'Failed to start registration');
            }
        }
    };

    const isValid = name.length >= 2 && phone.length >= 10;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View
                    style={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + Spacing.xl }
                    ]}
                >
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Text style={styles.title}>Create <Text style={styles.titleHighlight}>Account</Text></Text>
                        <Text style={styles.subtitle}>Join serving over 1M+ customers across the globe.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.formContainer}>
                            <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" autoComplete="name" autoCapitalize="words" error={fieldErrors.name} leftIcon={<Ionicons name="person-outline" size={22} color={Colors.primary} />} />
                            <View style={styles.spacer} />
                            <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="Enter your phone number" keyboardType="number-pad" maxLength={10} leftIcon={<Ionicons name="call-outline" size={20} color={Colors.primary} />} prefix={<CountrySelector onSelect={setCountry} selectedCountry={country} />} error={fieldErrors.phone} />
                            <View style={styles.spacer} />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                            <Button title="Create Account" onPress={handleRegister} loading={isLoading} style={styles.registerBtn} />
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>or join with</Text>
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
                            Already have an account?{' '}
                            <Text
                                style={styles.footerLink}
                                onPress={() => router.push('/(auth)/login')}
                            >
                                Sign In
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                            By continuing, you agree to our <Text style={styles.termsHighlight}>Terms</Text> & <Text style={styles.termsHighlight}>Privacy Policy</Text>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
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
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 10 },
        // shadowOpacity: 0.05,
        // shadowRadius: 20,
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
    registerBtn: {
        marginTop: 10
        // shadowColor: Colors.primary,
        // shadowOffset: { width: 0, height: 10 },
        // shadowOpacity: 0.3,
        // shadowRadius: 15,
        // elevation: 10,
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
    errorText: {
        color: Colors.error,
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 10,
    },
    termsContainer: {
        marginTop: 30,
        paddingVertical: 20,
    },
    termsText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsHighlight: {
        color: '#64748B',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
});
