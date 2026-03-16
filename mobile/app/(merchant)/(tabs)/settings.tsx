import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantSettings } from '../../../lib/merchant';
import { useFocusEffect } from '@react-navigation/native';
import { getImageUrl } from '../../../lib/api';

export default function MerchantSettingsScreen() {
    const router = useRouter();
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

    useFocusEffect(
        React.useCallback(() => {
            fetchSettings();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#10B981';
            case 'PENDING_REVIEW': return '#F59E0B';
            case 'REJECTED': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const menuItems = [
        {
            title: 'Business Profile',
            subtitle: 'Update business info and location',
            icon: 'storefront',
            color: '#4F46E5',
            onPress: () => router.push('/(merchant)/profile'),
        },
        {
            title: 'Account Verification',
            subtitle: settings?.verificationStatus === 'APPROVED' ? 'Verified Account' : 'Submit documents for KYC',
            icon: 'shield-checkmark',
            color: getStatusColor(settings?.verificationStatus || 'NOT_SUBMITTED'),
            onPress: () => router.push('/(merchant)/verification'),
            status: settings?.verificationStatus
        },
        {
            title: 'Manage Agents',
            subtitle: 'View and add service agents',
            icon: 'people',
            color: '#10B981',
            onPress: () => router.push('/(merchant)/agents'),
        },
        {
            title: 'Earnings & Payouts',
            subtitle: 'View revenue and settlements',
            icon: 'wallet',
            color: '#F59E0B',
            onPress: () => router.push('/(merchant)/earnings'),
        },
        {
            title: 'Promotions',
            subtitle: 'Create and manage offers',
            icon: 'pricetag',
            color: '#EC4899',
            onPress: () => router.push('/(merchant)/promotions'),
        },
    ];

    if (loading && !settings) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        {settings?.logoUrl ? (
                            <Image source={{ uri: getImageUrl(settings.logoUrl) || undefined }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="business" size={32} color={Colors.primary} />
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.businessName}>{settings?.businessName || user?.name || 'My Business'}</Text>
                            {settings?.verificationStatus === 'APPROVED' && (
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        <Text style={styles.phoneNumber}>{settings?.phone || user?.phone || ''}</Text>
                        {settings?.verificationStatus && settings.verificationStatus !== 'APPROVED' && (
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settings.verificationStatus) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(settings.verificationStatus) }]}>
                                    {settings.verificationStatus.replace('_', ' ')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '10' }]}>
                                <Ionicons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    businessName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    phoneNumber: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    menuContainer: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
    },
    menuSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: 8,
    },
    logoutText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.error,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    version: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },
});
