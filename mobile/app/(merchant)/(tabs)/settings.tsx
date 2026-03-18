import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Alert,
    ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    Store,
    ShieldCheck,
    Users,
    Wallet,
    Tag,
    ChevronRight,
    LogOut,
    CheckCircle,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Colors, Spacing } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantSettings } from '../../../lib/merchant';
import { getImageUrl } from '../../../lib/api';

export default function MerchantSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { logout, user } = useAuthStore();
    const [settings, setSettings] = React.useState<MerchantSettings | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchSettings = async () => {
        try {
            const res = await merchantApi.getSettings();
            setSettings(res.data.settings);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(React.useCallback(() => { fetchSettings(); }, []));

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                logout();
            }},
        ]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return Colors.success;
            case 'PENDING_REVIEW': return '#F59E0B';
            case 'REJECTED': return '#EF4444';
            default: return '#94A3B8';
        }
    };

    const menuItems = [
        {
            title: 'Business Profile',
            subtitle: 'Update business info & location',
            icon: <Store size={20} color="#6366F1" strokeWidth={2} />,
            iconBg: '#EEF2FF',
            onPress: () => router.push('/(merchant)/profile'),
        },
        {
            title: 'Account Verification',
            subtitle: settings?.verificationStatus === 'APPROVED' ? 'Verified Account' : 'Submit KYC documents',
            icon: <ShieldCheck size={20} color={getStatusColor(settings?.verificationStatus || 'NOT_SUBMITTED')} strokeWidth={2} />,
            iconBg: getStatusColor(settings?.verificationStatus || 'NOT_SUBMITTED') + '14',
            onPress: () => router.push('/(merchant)/verification'),
        },
        {
            title: 'Manage Agents',
            subtitle: 'View and add service agents',
            icon: <Users size={20} color="#10B981" strokeWidth={2} />,
            iconBg: '#ECFDF5',
            onPress: () => router.push('/(merchant)/agents'),
        },
        {
            title: 'Earnings & Payouts',
            subtitle: 'Revenue and settlements',
            icon: <Wallet size={20} color="#F59E0B" strokeWidth={2} />,
            iconBg: '#FFFBEB',
            onPress: () => router.push('/(merchant)/earnings'),
        },
        {
            title: 'Promotions',
            subtitle: 'Create and manage offers',
            icon: <Tag size={20} color="#EC4899" strokeWidth={2} />,
            iconBg: '#FDF2F8',
            onPress: () => router.push('/(merchant)/promotions'),
        },
    ];

    if (loading && !settings) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <Pressable
                        onPress={() => router.push('/(merchant)/profile')}
                        style={({ pressed }) => [styles.profileCard, pressed && { transform: [{ scale: 0.98 }] }]}
                    >
                        <View style={styles.avatarContainer}>
                            {settings?.logoUrl ? (
                                <Image source={{ uri: getImageUrl(settings.logoUrl) || undefined }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Store size={28} color={Colors.primary} strokeWidth={1.5} />
                                </View>
                            )}
                        </View>

                        <View style={styles.profileInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.businessName} numberOfLines={1}>
                                    {settings?.businessName || user?.name || 'My Business'}
                                </Text>
                                {settings?.verificationStatus === 'APPROVED' && (
                                    <CheckCircle size={16} color={Colors.success} fill={Colors.success + '20'} />
                                )}
                            </View>
                            <Text style={styles.phoneText}>{settings?.phone || user?.phone || ''}</Text>
                            {settings?.verificationStatus && settings.verificationStatus !== 'APPROVED' && (
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settings.verificationStatus) + '14' }]}>
                                    <Text style={[styles.statusBadgeText, { color: getStatusColor(settings.verificationStatus) }]}>
                                        {settings.verificationStatus.replace('_', ' ')}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
                    </Pressable>
                </Animated.View>

                {/* Menu Items */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={index}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.onPress(); }}
                            style={({ pressed }) => [
                                styles.menuItem,
                                pressed && { backgroundColor: '#F8FAFC' },
                                index === menuItems.length - 1 && { borderBottomWidth: 0 },
                            ]}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                                {item.icon}
                            </View>
                            <View style={styles.menuTextBox}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                        </Pressable>
                    ))}
                </Animated.View>

                {/* Logout */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Pressable
                        onPress={handleLogout}
                        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
                    >
                        <LogOut size={18} color="#EF4444" strokeWidth={2} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                </Animated.View>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },

    // Profile Card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: Spacing.lg,
        padding: 18,
        borderRadius: 20,
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 14,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    profileInfo: { flex: 1 },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    businessName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        flexShrink: 1,
    },
    phoneText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // Menu
    menuCard: {
        backgroundColor: '#FFF',
        marginHorizontal: Spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    menuIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextBox: { flex: 1 },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        padding: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '600',
        paddingVertical: 24,
    },
});
