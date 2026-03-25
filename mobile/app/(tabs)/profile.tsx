import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logout, user } = useAuthStore();

    const MENU_ITEMS = [
        { icon: 'person-outline', title: 'Personal Details', subtitle: 'Update your name and email', route: '/(customer)/edit-profile' },
        { icon: 'location-outline', title: 'Saved Addresses', subtitle: 'Manage your home and office locations', route: '/(customer)/profile/addresses' },
        { icon: 'card-outline', title: 'Wallet & Payments', subtitle: 'Manage your balance and transactions', route: '/(customer)/profile/wallet' },
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Preference and alert settings', route: '/(customer)/notifications' },
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQs and direct contact', route: '' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header / User Info */}
                <LinearGradient
                    colors={[Colors.primary, '#1A1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}
                >
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || '+91 99999 00000'}</Text>
                    </View>
                    <Pressable 
                        style={styles.editBtn}
                        onPress={() => router.push('/(customer)/edit-profile')}
                    >
                        <Ionicons name="create" size={20} color="#FFF" />
                    </Pressable>
                </LinearGradient>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingBottom: 160 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.xl,
        paddingTop: Spacing.xl * 2,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    userInfo: { flex: 1, marginLeft: Spacing.md },
    userName: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
    editBtn: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
    },
    section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md, letterSpacing: 0.5, textTransform: 'uppercase' },
    menuCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    menuContent: { flex: 1, marginLeft: Spacing.md },
    menuTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
    menuSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)', marginHorizontal: Spacing.lg },
    footer: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
    logoutBtn: { width: '100%' },
    versionText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
