import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types/auth';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - 12) / 2;

interface RoleOption {
    id: UserRole;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    gradient: [string, string];
}

const ROLES: RoleOption[] = [
    {
        id: 'CUSTOMER',
        title: 'Customer',
        description: 'I want to book services for my home',
        icon: 'home',
        color: Colors.primary,
        gradient: [Colors.primary, Colors.primary + 'CC'],
    },
    {
        id: 'MERCHANT',
        title: 'Partner',
        description: 'I am a service provider/company',
        icon: 'briefcase',
        color: '#3B82F6',
        gradient: ['#3B82F6', '#2563EB'],
    },
    {
        id: 'AGENT',
        title: 'Agent',
        description: 'I want to work as a delivery agent',
        icon: 'bicycle',
        color: '#10B981',
        gradient: ['#10B981', '#059669'],
    },
];

export default function RoleSelectScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isLoading, user } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [email, setEmail] = useState(user?.email || '');

    const handleContinue = async () => {
        if (!selectedRole) return;

        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Email Required', 'Please enter a valid email address.');
            return;
        }

        if (selectedRole === 'CUSTOMER') {
            router.push({
                pathname: '/(onboarding)/location',
                params: { role: selectedRole, email: email.trim() }
            });
            return;
        }

        router.push({
            pathname: '/(onboarding)/role-details',
            params: { role: selectedRole, email: email.trim() }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Decorations */}
            <View style={styles.bgContainer}>
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.decorationCircle1} />
                <View style={styles.decorationCircle2} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={12}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>

                    <View style={styles.header}>
                        <Text style={styles.title}>Hello, {user?.name?.split(' ')[0] || 'Partner'}!</Text>
                        <Text style={styles.subtitle}>Choose your journey to get started with ServeIQ.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Communication Email</Text>
                        <View style={styles.inputCard}>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="john@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                containerStyle={styles.emailInput}
                            />
                            <Text style={styles.inputHint}>We'll use this for important updates.</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Choose your Role</Text>
                        <View style={styles.gridContainer}>
                            {ROLES.map((role) => (
                                <Pressable
                                    key={role.id}
                                    style={[
                                        styles.roleCard,
                                        selectedRole === role.id && styles.roleCardActive
                                    ]}
                                    onPress={() => setSelectedRole(role.id)}
                                >
                                    <LinearGradient
                                        colors={selectedRole === role.id ? role.gradient : ['#F1F5F9', '#F1F5F9']}
                                        style={styles.iconContainer}
                                    >
                                        <Ionicons
                                            name={role.icon}
                                            size={32}
                                            color={selectedRole === role.id ? '#FFFFFF' : '#94A3B8'}
                                        />
                                    </LinearGradient>
                                    <Text style={[
                                        styles.roleTitle,
                                        selectedRole === role.id && styles.roleTitleActive
                                    ]}>{role.title}</Text>
                                    <Text style={styles.roleDescription}>{role.description}</Text>

                                    {selectedRole === role.id && (
                                        <View style={styles.checkBadge}>
                                            <Ionicons name="checkmark-circle" size={24} color={role.color} />
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>

            </KeyboardAvoidingView>
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!selectedRole || isLoading}
                    loading={isLoading}
                    variant="primary"
                    style={styles.actionBtn}
                />
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
        overflow: 'hidden',
    },
    decorationCircle1: {
        position: 'absolute',
        top: -100,
        right: -120,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: Colors.primary + '03',
    },
    decorationCircle2: {
        position: 'absolute',
        bottom: 80,
        left: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: Colors.primary + '05',
    },
    flex: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        lineHeight: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    inputCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    emailInput: {
        marginBottom: 0,
    },
    inputHint: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
        marginLeft: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    roleCard: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.02,
        shadowRadius: 15,
        elevation: 2,
    },
    roleCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
        // Glow effect
        shadowColor: Colors.primary,
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#64748B',
        textAlign: 'center',
    },
    roleTitleActive: {
        color: '#0F172A',
    },
    roleDescription: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 16,
    },
    checkBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    actionBtn: {
        height: 10,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 2,
    },
});
