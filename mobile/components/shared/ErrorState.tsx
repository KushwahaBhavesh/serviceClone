import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export default function ErrorState({
    message = 'Something went wrong. Please try again.',
    onRetry,
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons name="alert-circle" size={44} color="#EF4444" />
            </View>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Pressable style={styles.retryBtn} onPress={onRetry}>
                    <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.retryText}>Try Again</Text>
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
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    message: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: Spacing.lg,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
    },
    retryText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: '#FFF',
    },
});
