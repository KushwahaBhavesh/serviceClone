import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Switch,
    Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    User, Bell, Shield, CircleHelp,
    LogOut, ChevronRight, Star,
    ExternalLink, MapPin, Smartphone,
    CheckCircle2, CreditCard,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, MerchantSettings } from '../../../lib/merchant';

export default function MerchantSettingsScreen() {
    const { logout, user } = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<MerchantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await merchantApi.getSettings();
                setProfile(response.data.settings);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const MenuItem = ({ icon: Icon, label, value, onPress, dangerous, last }: any) => (
        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed, last && styles.menuItemLast]}
            onPress={onPress}
        >
            <View style={[styles.iconBox, dangerous && styles.iconBoxDangerous]}>
                <Icon size={18} color={dangerous ? '#EF4444' : '#64748B'} strokeWidth={2.2} />
            </View>
            <Text style={[styles.menuLabel, dangerous && styles.menuLabelDangerous]}>{label}</Text>
            <View style={styles.menuRight}>
                {value !== undefined ? (
                    typeof value === 'boolean' ? (
                        <Switch
                            value={value}
                            onValueChange={onPress}
                            trackColor={{ false: '#E2E8F0', true: Colors.primary + '40' }}
                            thumbColor={value ? Colors.primary : '#94A3B8'}
                        />
                    ) : (
                        <Text style={styles.menuValue}>{value}</Text>
                    )
                ) : (
                    <ChevronRight size={18} color="#CBD5E1" strokeWidth={2.5} />
                )}
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={styles.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.title}>Settings</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleLabel}>MERCHANT</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }]}
            >
                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={styles.profileCard}>
                        <View style={styles.profileMain}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[Colors.primary, '#FF8533']}
                                    style={styles.avatarGradient}
                                >
                                    <User size={32} color="#FFF" />
                                </LinearGradient>
                                {profile?.isVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <CheckCircle2 size={12} color="#FFF" strokeWidth={3} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.businessName}>{profile?.businessName || user?.name}</Text>
                                <View style={styles.ratingRow}>
                                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{profile?.rating || '5.0'}</Text>
                                    <Text style={styles.reviewCount}>({profile?.totalReviews || 0} reviews)</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.profileDivider} />

                        <View style={styles.profileStats}>
                            <View style={styles.statItem}>
                                <MapPin size={14} color="#94A3B8" />
                                <Text style={styles.statText} numberOfLines={1}>{profile?.address || 'Set Address'}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Smartphone size={14} color="#94A3B8" />
                                <Text style={styles.statText}>{user?.phone || 'No Phone'}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Groups */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>BUSINESS</Text>
                    <View style={styles.groupCard}>
                        <MenuItem icon={User} label="Business Profile" onPress={() => router.push('/(merchant)/profile-edit')} />
                        <MenuItem icon={CreditCard} label="Payout Settings" onPress={() => router.push('/(merchant)/payout-settings')} />
                        <MenuItem icon={Bell} label="Push Notifications" value={notifications} onPress={() => setNotifications(!notifications)} last />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>
                    <View style={styles.groupCard}>
                        <MenuItem icon={CircleHelp} label="Help Center" onPress={() => {}} />
                        <MenuItem icon={Shield} label="Privacy Policy" onPress={() => Linking.openURL('https://example.com/privacy')} />
                        <MenuItem icon={ExternalLink} label="Terms of Service" onPress={() => Linking.openURL('https://example.com/terms')} last />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
                    <View style={styles.groupCard}>
                        <MenuItem
                            icon={LogOut}
                            label="Logout"
                            dangerous
                            onPress={handleLogout}
                            last
                        />
                    </View>
                    <Text style={styles.version}>v.2.4.1 (Build 108)</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scroll: { paddingHorizontal: Spacing.xl },

    // Header
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    roleBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    roleLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: 10,
    },
    profileMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGradient: {
        width: 72,
        height: 72,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: { flex: 1 },
    businessName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    reviewCount: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    profileDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 18,
    },
    profileStats: { gap: 10 },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        flex: 1,
    },

    // Sections
    section: { marginTop: 24 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginLeft: 12,
        marginBottom: 10,
    },
    groupCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    menuItemPressed: { backgroundColor: '#F8FAFC' },
    menuItemLast: { borderBottomWidth: 0 },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconBoxDangerous: { backgroundColor: '#FEF2F2' },
    menuLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    menuLabelDangerous: { color: '#EF4444' },
    menuRight: { flexDirection: 'row', alignItems: 'center' },
    menuValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },

    version: {
        textAlign: 'center',
        fontSize: 11,
        color: '#CBD5E1',
        fontWeight: '600',
        marginTop: 20,
    },
});
