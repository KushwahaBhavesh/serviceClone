import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/ui/Button';

export default function AgentProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const menuItems = [
        { icon: 'calendar-outline', label: 'Schedule & Availability', onPress: () => router.push('/(agent)/schedule' as any) },
        { icon: 'time-outline', label: 'Job History', onPress: () => router.push('/(agent)/job-history' as any) },
        { icon: 'help-buoy-outline', label: 'Help & Support', onPress: () => router.push('/(agent)/support') },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => { } },
    ] as const;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <Text style={styles.title}>My Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarLarge}>
                        <Ionicons name="person" size={40} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>Agent Portal</Text>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index === menuItems.length - 1 && styles.lastItem]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name={item.icon} size={22} color={Colors.text} />
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <Button
                    title="Logout"
                    variant="outline"
                    onPress={logout}
                    style={styles.logoutBtn}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { padding: Spacing.lg, paddingBottom: Spacing.md },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    content: { padding: Spacing.lg },

    profileCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    userName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    userEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
    roleBadge: {
        marginTop: Spacing.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: Colors.primary + '15',
        borderRadius: 12,
    },
    roleText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

    menuSection: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    lastItem: { borderBottomWidth: 0 },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    menuLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },

    logoutBtn: { marginBottom: Spacing.xxl }
});
