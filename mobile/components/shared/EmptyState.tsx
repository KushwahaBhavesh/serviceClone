import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    onCta?: () => void;
}

export default function EmptyState({ icon = 'document-text-outline', title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {ctaLabel && onCta && (
                <Pressable style={styles.ctaBtn} onPress={onCta}>
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl * 2,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.backgroundAlt || '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
        marginBottom: Spacing.lg,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
    },
    ctaText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: '#FFF',
    },
});
