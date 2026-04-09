import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface RoleGuardProps {
    allowedRoles: string[];
    /** For merchants — requires APPROVED status */
    requireApproved?: boolean;
    /** For agents — requires merchantId linkage */
    requireMerchant?: boolean;
    children: React.ReactNode;
}

export default function RoleGuard({
    allowedRoles,
    requireApproved = false,
    requireMerchant = false,
    children,
}: RoleGuardProps) {
    const { user } = useAuthStore();
    const router = useRouter();

    if (!user) return null;

    const u = user as any; // extended fields from API

    // Suspended account
    if (u.status === 'SUSPENDED') {
        return (
            <GuardScreen
                icon="ban"
                iconColor="#EF4444"
                iconBg="#FEF2F2"
                title="Account Suspended"
                subtitle="Your account has been suspended. Please contact support for assistance."
                ctaLabel="Contact Support"
                onCta={() => Linking.openURL('mailto:support@serviceclone.com')}
            />
        );
    }

    // Role check
    if (!allowedRoles.includes(u.role)) {
        return (
            <GuardScreen
                icon="lock-closed"
                iconColor={Colors.textMuted}
                iconBg={Colors.backgroundAlt || '#F1F5F9'}
                title="Access Restricted"
                subtitle="You don't have permission to access this section."
                ctaLabel="Go Home"
                onCta={() => router.replace('/(tabs)/home' as any)}
            />
        );
    }

    // Merchant verification check
    if (u.role === 'MERCHANT' && requireApproved && u.verificationStatus !== 'APPROVED') {
        return (
            <GuardScreen
                icon="hourglass"
                iconColor="#F59E0B"
                iconBg="#FFFBEB"
                title="Verification Pending"
                subtitle="Your account is under review. We'll notify you once your documents are verified and approved."
                ctaLabel="Check Status"
                onCta={() => router.push('/(merchant)/verification' as any)}
            />
        );
    }

    // Agent merchant linkage check
    if (u.role === 'AGENT' && requireMerchant && !u.merchantId) {
        return (
            <GuardScreen
                icon="link"
                iconColor="#6366F1"
                iconBg="#EEF2FF"
                title="Not Linked Yet"
                subtitle="You haven't been linked to a service provider yet. Ask your employer to add you as an agent."
                ctaLabel="Refresh"
                onCta={() => router.replace('/(agent)/(tabs)/jobs' as any)}
            />
        );
    }

    return <>{children}</>;
}

// ─── Internal Guard Screen ───

function GuardScreen({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    ctaLabel,
    onCta,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    onCta: () => void;
}) {
    return (
        <View style={styles.container}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={44} color={iconColor} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <Pressable style={styles.ctaBtn} onPress={onCta}>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
        marginBottom: Spacing.xl,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
    },
    ctaText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
