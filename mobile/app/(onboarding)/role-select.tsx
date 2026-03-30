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
import { 
    Home, 
    Briefcase, 
    Bicycle, 
    CheckCircle2, 
    ChevronLeft,
    User,
    Mail,
    ArrowRight
} from 'lucide-react-native';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

const { width } = Dimensions.get('window');

// ─── Constants ───
const DARK_SLATE = '#0F172A';
const ELECTRIC_ORANGE = '#FF6B00';
const GLASS_WHITE = 'rgba(255, 255, 255, 0.08)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.12)';

interface RoleOption {
    id: UserRole;
    title: string;
    description: string;
    icon: any;
    color: string;
}

const ROLES: RoleOption[] = [
    {
        id: 'CUSTOMER',
        title: 'Customer',
        description: 'I want to book services for my home',
        icon: Home,
        color: '#38BDF8', // Sky Blue
    },
    {
        id: 'MERCHANT',
        title: 'Partner',
        description: 'I am a service provider/company',
        icon: Briefcase,
        color: ELECTRIC_ORANGE,
    },
    {
        id: 'AGENT',
        title: 'Agent',
        description: 'I want to work as a service agent',
        icon: Bicycle,
        color: '#10B981', // Emerald
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
            <StatusBar style="light" />
            
            <LinearGradient
                colors={[DARK_SLATE, '#1E293B']}
                style={StyleSheet.absoluteFill}
            />

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
                            <ChevronLeft size={24} color="#FFF" />
                        </Pressable>
                    </Animated.View>

                    <View style={styles.header}>
                        <Animated.Text 
                            entering={FadeInDown.delay(200)} 
                            style={styles.title}
                        >
                            Hello, {user?.name?.split(' ')[0] || 'Partner'}!
                        </Animated.Text>
                        <Animated.Text 
                            entering={FadeInDown.delay(300)} 
                            style={styles.subtitle}
                        >
                            Choose your journey to get started.
                        </Animated.Text>
                    </View>

                    <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
                        <Text style={styles.sectionLabel}>Personal Details</Text>
                        <View style={styles.glassCard}>
                            <View style={styles.inputRow}>
                                <User size={20} color="#64748B" style={styles.inputIcon} />
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    autoCapitalize="words"
                                    style={styles.input}
                                    containerStyle={styles.inputContainer}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.inputRow}>
                                <Mail size={20} color="#64748B" style={styles.inputIcon} />
                                <Input
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email Address"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                    containerStyle={styles.inputContainer}
                                />
                            </View>
                        </View>
                    </Animated.View>

                    <View style={styles.section}>
                        <Animated.Text entering={FadeInUp.delay(500)} style={styles.sectionLabel}>
                            Choose your Role
                        </Animated.Text>
                        <View style={styles.gridContainer}>
                            {ROLES.map((role, index) => {
                                const isSelected = selectedRole === role.id;
                                return (
                                    <View 
                                        key={role.id}
                                        style={styles.roleWrapper}
                                    >
                                        <Pressable
                                            style={[
                                                styles.roleCard,
                                                isSelected && { borderColor: role.color, backgroundColor: 'rgba(255,255,255,0.05)' }
                                            ]}
                                            onPress={() => handleSelectRole(role.id)}
                                        >
                                            <View style={[styles.iconBox, { backgroundColor: isSelected ? role.color : 'rgba(255,255,255,0.03)' }]}>
                                                <role.icon 
                                                    size={28} 
                                                    color={isSelected ? '#FFF' : '#64748B'} 
                                                    strokeWidth={2.5} 
                                                />
                                            </View>
                                            <Text style={[
                                                styles.roleTitle,
                                                isSelected && { color: '#FFF' }
                                            ]}>{role.title}</Text>
                                            <Text style={styles.roleDesc}>{role.description}</Text>

                                            {isSelected && (
                                                <View style={styles.checkBadge}>
                                                    <CheckCircle2 size={20} color={role.color} fill="#FFF" />
                                                </View>
                                            )}
                                        </Pressable>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0)', DARK_SLATE]}
                    style={styles.footerGradient}
                    pointerEvents="none"
                />
                
                <Animated.View entering={FadeInUp.delay(800)} style={styles.actionContainer}>
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
                            colors={[ELECTRIC_ORANGE, '#E66100']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.btnText}>Continue</Text>
                            <View style={styles.btnIcon}>
                                <ArrowRight size={20} color="#FFF" strokeWidth={3} />
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
        backgroundColor: DARK_SLATE,
    },
    flex: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: GLASS_WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
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
        backgroundColor: GLASS_WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        overflow: 'hidden',
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
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        height: 56,
    },
    divider: {
        height: 1,
        backgroundColor: GLASS_BORDER,
        marginHorizontal: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    roleWrapper: {
        width: (width - Spacing.xl * 2 - 12) / 2,
    },
    roleCard: {
        aspectRatio: 0.9,
        backgroundColor: GLASS_WHITE,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1.5,
        borderColor: GLASS_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    roleTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 4,
    },
    roleDesc: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 14,
    },
    checkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
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
        shadowColor: ELECTRIC_ORANGE,
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
