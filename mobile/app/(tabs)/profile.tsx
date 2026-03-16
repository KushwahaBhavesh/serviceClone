import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const router = useRouter();
    const { logout, user } = useAuthStore();

    const MENU_ITEMS = [
        { icon: 'location-outline', title: 'Saved Addresses', subtitle: 'Manage your home and office locations', route: '/(customer)/profile/addresses' },
        { icon: 'card-outline', title: 'Wallet & Payments', subtitle: 'Manage your balance and transactions', route: '/(customer)/profile/wallet' },
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Preference and alert settings', route: '/(tabs)/profile' },
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQs and direct contact', route: '/(tabs)/profile' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header / User Info */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={40} color={Colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || '+91 99999 00000'}</Text>
                    </View>
                    <Pressable style={styles.editBtn}>
                        <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    </Pressable>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuCard}>
                        {MENU_ITEMS.map((item, index) => (
                            <View key={item.title}>
                                <Pressable
                                    style={styles.menuItem}
                                    onPress={() => item.route && router.push(item.route as any)}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name={item.icon as any} size={22} color={Colors.text} />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuTitle}>{item.title}</Text>
                                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                </Pressable>
                                {index < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>More</Text>
                    <View style={styles.menuCard}>
                        <Pressable style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="share-social-outline" size={22} color={Colors.text} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Invite Friends</Text>
                                <Text style={styles.menuSubtitle}>Get rewards for referrals</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Sign Out"
                        variant="ghost"
                        onPress={logout}
                        style={styles.logoutBtn}
                        textStyle={{ color: Colors.error }}
                    />
                    <Text style={styles.versionText}>Version 1.0.4 Phase 1</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: { flex: 1, marginLeft: Spacing.md },
    userName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    userEmail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    editBtn: {
        padding: Spacing.sm,
        backgroundColor: Colors.primary + '08',
        borderRadius: BorderRadius.md,
    },
    section: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    menuCard: {
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: { flex: 1, marginLeft: Spacing.md },
    menuTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    menuSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
    footer: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
    logoutBtn: { width: '100%' },
    versionText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
