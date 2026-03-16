import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

export default function LocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { role, email, businessName, skills, businessCategory, description, panNumber, gstNumber } = useLocalSearchParams<{
        role: UserRole;
        email: string;
        businessName?: string;
        skills?: string;
        businessCategory?: string;
        description?: string;
        panNumber?: string;
        gstNumber?: string;
    }>();
    const { completeOnboarding, isLoading, user } = useAuthStore();

    const [locationName, setLocationName] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const handleAutoDetect = async () => {
        setIsFetchingLocation(true);
        // Simulate GPS fetching delay for UI feedback
        setTimeout(() => {
            setLocationName('Sector 62, Noida, India');
            setIsFetchingLocation(false);
        }, 1500);
    };

    const handleFinishOnboarding = async () => {
        if (!locationName.trim()) {
            Alert.alert('Location Required', 'Please enter your service location.');
            return;
        }

        try {
            await completeOnboarding({
                role: role || 'CUSTOMER',
                email,
                businessName,
                businessCategory,
                description,
                panNumber,
                gstNumber,
                skills: skills ? skills.split(',') : undefined,
                name: user?.name,
                locationName: locationName.trim(),
                latitude: 28.6273928, // Mock GPS coords
                longitude: 77.3725807,
            });

            if (role === 'MERCHANT') {
                router.replace('/(merchant)/dashboard');
            } else if (role === 'AGENT') {
                router.replace('/(agent)/dashboard');
            } else {
                router.replace('/(tabs)/home');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to complete onboarding');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.bgContainer}>
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={12}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </Pressable>
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepText}>Step 2 of 2</Text>
                    </View>
                    <Text style={styles.title}>Service Area</Text>
                    <Text style={styles.subtitle}>
                        We use your location to connect you with services and providers in your area.
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.body}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.autoDetectButton,
                            pressed && { opacity: 0.8 }
                        ]}
                        onPress={handleAutoDetect}
                        disabled={isFetchingLocation || isLoading}
                    >
                        <LinearGradient
                            colors={['rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.03)']}
                            style={styles.autoDetectGradient}
                        >
                            {isFetchingLocation ? (
                                <ActivityIndicator color={Colors.primary} size="small" />
                            ) : (
                                <Ionicons name="navigate" size={24} color={Colors.primary} />
                            )}
                            <Text style={styles.autoDetectText}>
                                {isFetchingLocation ? 'Locating...' : 'Use current location'}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or manual entry</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Input
                            value={locationName}
                            onChangeText={setLocationName}
                            placeholder="e.g. Sector 62, Noida"
                            autoComplete="street-address"
                        />
                    </View>
                </View>

                {/* Map Illustration / Placeholder */}
                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <View style={styles.mapIconCircle}>
                            <Ionicons name="map" size={40} color="#94A3B8" />
                        </View>
                        <Text style={styles.mapText}>Map Preview</Text>
                        <Text style={styles.mapSubtext}>Select area for service radius</Text>
                    </View>
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    <Button
                        title="Start Exploring"
                        onPress={handleFinishOnboarding}
                        disabled={!locationName.trim() || isLoading}
                        loading={isLoading}
                        variant="primary"
                        style={styles.actionBtn}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    header: {
        marginTop: 30,
        marginBottom: 30,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    stepContainer: {
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        lineHeight: 22,
    },
    body: {
        gap: 20,
    },
    autoDetectButton: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.primary + '20',
        borderStyle: 'dashed',
    },
    autoDetectGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 12,
    },
    autoDetectText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        marginBottom: 10,
    },
    mapContainer: {
        flex: 1,
        marginTop: 20,
        marginBottom: 30,
    },
    mapPlaceholder: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
    },
    mapIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    mapText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#64748B',
    },
    mapSubtext: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    footer: {
        paddingTop: 10,
    },
    actionBtn: {
        height: 56,
        borderRadius: 16,
    },
});
