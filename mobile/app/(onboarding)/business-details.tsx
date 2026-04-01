import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../constants/theme';
import { Input } from '../../components/ui/Input';

const { width } = Dimensions.get('window');

const GLASS_WHITE = 'rgba(0, 0, 0, 0.02)';
const GLASS_BORDER = 'rgba(0, 0, 0, 0.05)';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const { role, email, name } = useLocalSearchParams<{ role: string; email: string; name?: string }>();
    const insets = useSafeAreaInsets();

    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');

    const handleContinue = () => {
        if (!businessName.trim() || !businessCategory.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Required Fields', 'Please enter your business name and category.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        router.push({
            pathname: '/(onboarding)/location',
            params: {
                role,
                email,
                name,
                businessName: businessName.trim(),
                businessCategory: businessCategory.trim()
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100)}>
                        <Pressable
                            onPress={() => router.back()}
                            style={styles.backButton}
                            hitSlop={12}
                        >
                            <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                        </Pressable>
                    </Animated.View>

                    <View style={styles.header}>
                        <Animated.Text 
                            entering={FadeInDown.delay(200)} 
                            style={styles.title}
                        >
                            Business <Text style={styles.titleHighlight}>Profile</Text>
                        </Animated.Text>
                        <Animated.Text 
                            entering={FadeInDown.delay(300)} 
                            style={styles.subtitle}
                        >
                            Tell us about your service business.
                        </Animated.Text>
                    </View>

                    <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
                        <Text style={styles.sectionLabel}>Core Information</Text>
                        <View style={styles.glassCard}>
                            <View style={styles.inputRow}>
                                <Ionicons name="briefcase-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                                <Input
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    placeholder="Business Name"
                                    placeholderTextColor="rgba(0,0,0,0.3)"
                                    style={[styles.input, { color: Colors.textDark }]}
                                    containerStyle={styles.inputContainer}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.inputRow}>
                                <Ionicons name="pricetag-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                                <Input
                                    value={businessCategory}
                                    onChangeText={setBusinessCategory}
                                    placeholder="Service Category (e.g. Plumbing)"
                                    placeholderTextColor="rgba(0,0,0,0.3)"
                                    style={[styles.input, { color: Colors.textDark }]}
                                    containerStyle={styles.inputContainer}
                                />
                            </View>
                        </View>
                        <Animated.Text entering={FadeInUp.delay(500)} style={styles.hintText}>
                            This information will be visible to your customers.
                        </Animated.Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                
                <Animated.View entering={FadeInUp.delay(600)} style={styles.actionContainer}>
                    <Pressable
                        onPress={handleContinue}
                        disabled={!businessName || !businessCategory}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && { transform: [{ scale: 0.98 }] },
                            (!businessName || !businessCategory) && styles.btnDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.btnText}>Continue</Text>
                            <View style={styles.btnIcon}>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </View>
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
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: Colors.textDark,
        letterSpacing: -1,
    },
    titleHighlight: {
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 8,
        fontWeight: '500',
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
        marginLeft: 4,
    },
    glassCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 4,
    },
    inputContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    input: {
        color: Colors.textDark,
        fontSize: 16,
        fontWeight: '600',
        height: 64,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 16,
    },
    hintText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 16,
        marginLeft: 4,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
    },
    footerGradient: {
        position: 'absolute',
        top: -60,
        left: 0,
        right: 0,
        height: 120,
    },
    actionContainer: {
        marginBottom: 10,
    },
    primaryBtn: {
        borderRadius: 22,
        overflow: 'hidden',
        height: 64,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    btnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.2,
    },
    btnIcon: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});
