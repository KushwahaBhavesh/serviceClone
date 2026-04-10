import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    FadeInUp,
    FadeInDown,
} from 'react-native-reanimated';
import {
    User,
    Settings,
    ShieldCheck,
    LogOut,
    ChevronRight,
    Bell,
    HelpCircle,
    MapPin,
    Wallet,
    Share2
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../context/ToastContext';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logout, user } = useAuthStore();
    const { showSuccess, showInfo } = useToast();

    const MENU_ITEMS = [
        {
            icon: User,
            title: 'Personal Details',
            subtitle: 'Profile & contact information',
            route: '/(customer)/edit-profile',
        },
        {
            icon: MapPin,
            title: 'Saved Addresses',
            subtitle: 'Manage your delivery locations',
            route: '/(customer)/profile/addresses',
        },
        {
            icon: Wallet,
            title: 'Wallet & Payments',
            subtitle: 'Transaction history & balance',
            route: '/(customer)/profile/wallet',
        },
        {
            icon: Bell,
            title: 'Notifications',
            subtitle: 'Preferences & alerts',
            route: '/(customer)/notifications',
        },
        {
            icon: HelpCircle,
            title: 'Help & Support',
            subtitle: 'FAQs and assistance',
            route: '/(customer)/support',
        },
    ] as const;

    const handleLogout = async () => {
        try {
            await logout();
            showSuccess('Logged out successfully.');
        } catch (error) {
            showInfo('Logged out successfully.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Premium Sticky Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 80 }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                        style={StyleSheet.absoluteFill}
                    />
                </BlurView>
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.headerTitle}>PROFILE</Text>
                    <Pressable style={styles.headerIcon} onPress={() => router.push('/(customer)/edit-profile')}>
                        <Settings size={22} color="#111" strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 100, paddingBottom: 140 }
                ]}
            >
                {/* User Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={styles.heroCard}>
                        <View style={styles.avatarBox}>
                            <View style={styles.avatarCircle}>
                                <User size={32} color={Colors.primary} strokeWidth={2.5} />
                            </View>
                            <View style={styles.onlinePing} />
                        </View>

                        <View style={styles.userMainInfo}>
                            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                            <View style={styles.verifyBadge}>
                                <ShieldCheck size={10} color="#FFF" fill={Colors.primary} strokeWidth={2.5} />
                                <Text style={styles.verifyText}>VERIFIED ACCOUNT</Text>
                            </View>
                        </View>

                        <Pressable
                            style={styles.editBtn}
                            onPress={() => router.push('/(customer)/edit-profile')}
                        >
                            <Settings size={20} color="#AAA" />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Menu Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ACCOUNT SETTINGS</Text>
                    <View style={styles.menuContainer}>
                        {MENU_ITEMS.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Animated.View
                                    key={item.title}
                                    entering={FadeInUp.delay(150 + index * 50).springify()}
                                >
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.menuItem,
                                            pressed && styles.menuItemPressed
                                        ]}
                                        onPress={() => item.route && router.push(item.route as any)}
                                    >
                                        <View style={styles.menuIconBox}>
                                            <Icon size={20} color={Colors.primary} strokeWidth={2} />
                                        </View>
                                        <View style={styles.menuTextCol}>
                                            <Text style={styles.menuTitle}>{item.title}</Text>
                                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                        </View>
                                        <ChevronRight size={18} color="#DDD" strokeWidth={2.5} />
                                    </Pressable>
                                    {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
                                </Animated.View>
                            )
                        })}
                    </View>
                </View>

                {/* More Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>MORE OPTIONS</Text>
                    <View style={styles.menuContainer}>
                        <Pressable style={styles.menuItem}>
                            <View style={styles.menuIconBox}>
                                <Share2 size={20} color={Colors.primary} strokeWidth={2} />
                            </View>
                            <View style={styles.menuTextCol}>
                                <Text style={styles.menuTitle}>Refer a Friend</Text>
                                <Text style={styles.menuSubtitle}>Share the app with your network</Text>
                            </View>
                            <ChevronRight size={18} color="#DDD" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        onPress={handleLogout}
                        style={({ pressed }) => [
                            styles.logoutBtn,
                            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                        <Text style={styles.logoutText}>LOG OUT</Text>
                    </Pressable>
                    <Text style={styles.versionText}>VERSION 1.0.5</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, height: 80 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
    headerIcon: { width: 45, height: 45, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },

    scrollContent: { paddingHorizontal: 25 },

    // Hero Card
    heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 32, padding: 25, gap: 20, marginBottom: 30, borderWidth: 1, borderColor: '#F0F0F0' },
    avatarBox: { position: 'relative' },
    avatarCircle: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    onlinePing: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#FAFAFA' },
    userMainInfo: { flex: 1 },
    userName: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
    userEmail: { fontSize: 12, color: '#AAA', fontWeight: '600', marginTop: 2 },
    verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '10', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 10 },
    verifyText: { fontSize: 8, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
    editBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },

    // Sectioning
    section: { marginBottom: 30 },
    sectionHeader: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginBottom: 15, paddingLeft: 10, textTransform: 'uppercase' },
    menuContainer: { backgroundColor: '#FFF', borderRadius: 32, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },

    // Menu Item
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 18 },
    menuItemPressed: { backgroundColor: '#FAFAFA' },
    menuIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    menuTextCol: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.2 },
    menuSubtitle: { fontSize: 11, color: '#AAA', fontWeight: '600', marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 25 },

    // Footer
    footer: { alignItems: 'center', marginTop: 10, gap: 20 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
    categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
    chipTextActive: { color: '#FFF' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 24, borderWidth: 1, borderColor: '#FEE2E2' },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444', letterSpacing: 1 },
    defaultText: { fontSize: 7, fontWeight: '700', color: '#AAA', letterSpacing: 1 },
    versionText: { fontSize: 9, fontWeight: '800', color: '#DDD', letterSpacing: 1 },
});
