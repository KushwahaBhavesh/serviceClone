import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function SessionExpiredModal() {
    const { sessionExpired, logout } = useAuthStore();

    if (!sessionExpired) return null;

    const handleLogin = async () => {
        await logout();
    };

    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="time-outline" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Session Expired</Text>
                    <Text style={styles.message}>
                        Your session has expired. Please log in again to continue.
                    </Text>
                    <Pressable style={styles.loginBtn} onPress={handleLogin}>
                        <Text style={styles.loginText}>Log In</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.xl,
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    loginText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
