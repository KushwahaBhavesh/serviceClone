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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

const { width } = Dimensions.get('window');

interface RoleOption {
    id: UserRole;
    title: string;
    subtitle: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    benefits: string[];
}

const ROLES: RoleOption[] = [
    {
        id: 'CUSTOMER',
        title: 'Customer',
        subtitle: 'I want services',
        description: 'Book verified professionals for your home needs.',
        icon: 'home-outline',
        benefits: ['⚡ Instant Booking', '🛡️ Verified Pros', '🏷️ Best Prices'],
    },
    {
        id: 'MERCHANT',
        title: 'Merchant',
        subtitle: 'I provide services',
        description: 'Scale your business and manage your professional team.',
        icon: 'briefcase-outline',
        benefits: ['📈 Grow Business', '📱 Manage Team', '💰 Secure Payout'],
    },
    {
        id: 'AGENT',
        title: 'Agent',
        subtitle: 'I want to earn',
        description: 'Work flexibly and earn by providing services nearby.',
        icon: 'bicycle-outline',
        benefits: ['⏰ Flexible Hours', '💸 Weekly Payout', '📍 Nearby Tasks'],
    },
];

export default function RoleSelectScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isLoading, user } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [email, setEmail] = useState(user?.email || '');
    const [name, setName] = useState(user?.name || '');

    const handleContinue = async () => {
        if (!selectedRole) return;

        if (!name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Name Required', 'Please enter your full name.');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Email Required', 'Please enter a valid email address.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const params = { role: selectedRole, email: email.trim(), name: name.trim() };

        if (selectedRole === 'CUSTOMER') {
            router.push({ pathname: '/(onboarding)/location', params });
        } else if (selectedRole === 'MERCHANT') {
            router.push({ pathname: '/(onboarding)/business-details', params });
        } else {
            router.push({ pathname: '/(onboarding)/role-details', params });
        }
    };

    const handleSelectRole = (roleId: UserRole) => {
        Haptics.selectionAsync();
        setSelectedRole(roleId);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decorations */}
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
                        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
                            <Ionicons name="chevron-back" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
                            {selectedRole ? `Ready to join as ${selectedRole.toLowerCase()}?` : `Hello, ${user?.name?.split(' ')[0] || 'Merchant'}!`}
                        </Animated.Text>
                    </Animated.View>
                    <View style={styles.header}>

                        <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
                            Choose your journey to get started.
                        </Animated.Text>
                    </View>


                    {/* Personal Details Section */}
                    <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
                        <Text style={styles.sectionLabel}>Personal Details</Text>

                        <Input
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            autoCapitalize="words"
                            leftIcon={<Ionicons name="person-outline" size={20} color={Colors.primary} />}
                        // containerStyle={styles.cardInput}
                        />

                        <View style={{ height: Spacing.md }} />

                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
                        // containerStyle={styles.cardInput}
                        />
                    </Animated.View>

                    {/* Role Selection Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Choose your Role</Text>
                        <View style={styles.roleList}>
                            {ROLES.map((role, index) => {
                                const isSelected = selectedRole === role.id;
                                return (
                                    <Animated.View
                                        key={role.id}
                                        entering={FadeInRight.delay(500 + (index * 100))}
                                    >
                                        <Pressable
                                            onPress={() => handleSelectRole(role.id)}
                                            style={({ pressed }) => [
                                                styles.megaCard,
                                                isSelected && styles.megaCardSelected,
                                                pressed && { transform: [{ scale: 0.98 }] }
                                            ]}
                                        >
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                                                    <Ionicons
                                                        name={role.icon}
                                                        size={32}
                                                        color={isSelected ? '#FFF' : Colors.primary}
                                                    />
                                                </View>
                                                <View style={styles.roleInfo}>
                                                    <Text style={[styles.roleLabel, isSelected && styles.accentText]}>
                                                        {role.subtitle}
                                                    </Text>
                                                    <Text style={styles.roleTitle}>{role.title}</Text>
                                                </View>
                                                {isSelected && (
                                                    <View style={styles.checkIcon}>
                                                        <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
                                                    </View>
                                                )}
                                            </View>

                                            <Text style={styles.roleDescription}>{role.description}</Text>

                                            <View style={styles.benefitsContainer}>
                                                {role.benefits.map((benefit, bIndex) => (
                                                    <View key={bIndex} style={styles.benefitBadge}>
                                                        <Text style={styles.benefitText}>{benefit}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </Pressable>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer with Continue Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />

                <Animated.View entering={FadeInUp.delay(800)}>
                    <Pressable
                        onPress={handleContinue}
                        disabled={!selectedRole || isLoading}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && { transform: [{ scale: 0.98 }] },
                            (!selectedRole || isLoading) && styles.btnDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#E66100']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.btnText}>Continue to {selectedRole ? selectedRole.toLowerCase() : 'onboarding'}</Text>
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
        paddingHorizontal: Spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
        marginLeft: 4,
    },
    cardInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    roleList: {
        gap: 16,
    },
    megaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        // elevation: 2,
    },
    megaCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '03',
        shadowColor: Colors.primary,
        shadowOpacity: 0.05,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconBoxSelected: {
        backgroundColor: Colors.primary,
    },
    roleInfo: {
        flex: 1,
    },
    roleLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    accentText: {
        color: Colors.primary,
    },
    roleTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.textDark,
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: 8,
    },
    roleDescription: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: 16,
        fontWeight: '500',
    },
    benefitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    benefitBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    benefitText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
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
        textTransform: 'capitalize',
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
