import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    Dimensions,
    Platform,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    Zap,
    Clock,
    Users,
    Star,
    ChevronRight,
    BookOpen,
    Map,
    CalendarDays,
    Wallet,
    BarChart3,
    CheckCircle,
    Activity,
    ArrowUpRight,
    Bell,
    Settings,
    ShieldCheck
} from 'lucide-react-native';

import { Colors } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { merchantApi, type MerchantDashboard, type Agent } from '../../../lib/merchant';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Constants ───
const DASHBOARD_SECTIONS = [
    { id: 'HERO', type: 'hero' },
    { id: 'REVENUE', type: 'revenue' },
    { id: 'STATS', type: 'stats' },
    { id: 'ACTIONS', type: 'actions' },
    { id: 'NETWORK', type: 'network' },
];

// ─── Modular Components ───

const ImmersiveHero = React.memo(({ user, dashboard, insets }: any) => {
    const isVerified = dashboard?.verificationStatus === 'APPROVED';

    return (
        <View style={[styles.heroContainer, { paddingTop: insets.top + 20 }]}>
            <LinearGradient
                colors={[Colors.primary, '#FF8533', '#FFF']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.heroContent}>
                <Animated.View entering={FadeInDown.duration(800).springify()}>
                    <View style={styles.greetingHeader}>
                        <View>
                            <Text style={styles.greetingLabel}>{getTimeOfDay().toUpperCase()}</Text>
                            <Text style={styles.businessName}>{user?.name || 'Partner'}</Text>
                        </View>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push('/(merchant)/settings');
                            }}
                            style={styles.profileBtn}
                        >
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{user?.name?.[0] || 'M'}</Text>
                            </View>
                            {isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <ShieldCheck size={10} color="#FFF" fill={Colors.primary} />
                                </View>
                            )}
                        </Pressable>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(800).springify()} style={styles.quickStatusBox}>
                    <BlurView intensity={60} tint="light" style={styles.glassCard}>
                        <View style={styles.statusItem}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.statusVal}>{dashboard?.agentCount || 0}</Text>
                            <Text style={styles.statusLab}>AGENTS LIVE</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <View style={[styles.statusIndicator, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.statusVal}>{dashboard?.activeOrders || 0}</Text>
                            <Text style={styles.statusLab}>JOBS ACTIVE</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusItem}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
                            <Text style={styles.statusVal}>{dashboard?.pendingOrders || 0}</Text>
                            <Text style={styles.statusLab}>WAITING</Text>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </View>
    );
});

const RevenuePro = React.memo(({ dashboard }: any) => {
    return (
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.revCardContainer}>
            <LinearGradient
                colors={[Colors.primary, '#FF8533']}
                style={styles.revCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.revHeader}>
                    <View style={styles.revLabelBox}>
                        <Activity size={12} color={Colors.primary} />
                        <Text style={styles.revLabel}>Live Revenue</Text>
                    </View>
                    <View style={styles.pulseDot} />
                </View>

                <View style={styles.revMain}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.revVal}>{(dashboard?.todayRevenue ?? 0).toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.revFooter}>
                    <View style={styles.trendStat}>
                        <ArrowUpRight size={14} color="#10B981" />
                        <Text style={styles.trendVal}>+24%</Text>
                        <Text style={styles.trendLab}>vs Yesterday</Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(merchant)/earnings')}
                        style={styles.viewDetailedBtn}
                    >
                        <Text style={styles.detailedText}>DETAILS</Text>
                        <ChevronRight size={14} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                </View>

                {/* Visual Accent */}
                <View style={styles.revMesh} />
            </LinearGradient>
        </Animated.View>
    );
});

const BentoStatsGrid = React.memo(({ dashboard }: any) => {
    return (
        <View style={styles.bentoGrid}>
            <View style={styles.bentoRow}>
                <BentoCard
                    label="Customer Rating"
                    value={dashboard?.rating?.toFixed(1) || "4.8"}
                    icon={<Star size={18} color="#F59E0B" fill="#F59E0B" />}
                    delay={600}
                />
                <BentoCard
                    label="Active Agents"
                    value={dashboard?.agentCount || 0}
                    icon={<Users size={18} color={Colors.primary} />}
                    delay={700}
                />
            </View>
            <View style={styles.bentoRow}>
                <BentoCard
                    label="Success Rate"
                    value="98.2%"
                    icon={<CheckCircle size={18} color="#10B981" />}
                    delay={800}
                />
                <BentoCard
                    label="Avg. Duration"
                    value="42m"
                    icon={<Clock size={18} color="#6366F1" />}
                    delay={900}
                />
            </View>
        </View>
    );
});

const BentoCard = ({ label, value, icon, delay }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.bentoCard}>
        <View style={styles.bentoIconBox}>{icon}</View>
        <Text style={styles.bentoVal}>{value}</Text>
        <Text style={styles.bentoLab}>{label}</Text>
    </Animated.View>
);

const SmartActionGrid = React.memo(() => {
    const actions = [
        { label: 'Catalog', color: '#6366F1', icon: BookOpen, path: '/(merchant)/(tabs)/catalog' },
        { label: 'Team', color: Colors.primary, icon: Users, path: '/(merchant)/agents' },
        { label: 'Map', color: '#10B981', icon: Map, path: '/(merchant)/agents/map' },
        { label: 'Schedule', color: '#F59E0B', icon: CalendarDays, path: '/(merchant)/schedule' },
        { label: 'Payouts', color: '#EC4899', icon: Wallet, path: '/(merchant)/earnings' },
        { label: 'Analytics', color: '#111', icon: BarChart3, path: '/(merchant)/analytics' },
    ];

    return (
        <View style={styles.actionGridContainer}>
            <Text style={styles.sectionTitle}>SMART ACTIONS</Text>
            <View style={styles.actionGrid}>
                {actions.map((item, index) => (
                    <Animated.View key={item.label} entering={FadeInRight.delay(1000 + index * 50).springify()}>
                        <Pressable
                            style={styles.actionItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(item.path as any);
                            }}
                        >
                            <View style={[styles.actionIconOuter, { backgroundColor: item.color + '15' }]}>
                                <item.icon size={22} color={item.color} />
                            </View>
                            <Text style={styles.actionLabel}>{item.label}</Text>
                        </Pressable>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
});

const NetworkPulse = React.memo(({ agents }: any) => {
    return (
        <View style={styles.networkContainer}>
            <View style={styles.networkHeader}>
                <Text style={styles.sectionTitle}>TEAM NETWORK</Text>
                <Pressable onPress={() => router.push('/(merchant)/agents/map')}>
                    <Text style={styles.seeAllText}>LIVE MAP</Text>
                </Pressable>
            </View>

            <FlatList
                data={agents}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.agentList}
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInRight.delay(1300 + index * 100).springify()}>
                        <Pressable
                            style={styles.agentCard}
                            onPress={() => router.push(`/(merchant)/agents/${item.id}` as any)}
                        >
                            <View style={styles.agentAvatar}>
                                <Text style={styles.agentInit}>{item.user?.name?.[0]}</Text>
                                <View style={[
                                    styles.agentStatus,
                                    { backgroundColor: item.status === 'AVAILABLE' ? '#10B981' : item.status === 'BUSY' ? '#F59E0B' : '#94A3B8' }
                                ]} />
                            </View>
                            <Text style={styles.agentName} numberOfLines={1}>
                                {item.user?.name?.split(' ')[0]}
                            </Text>
                            <Text style={styles.agentStatusText}>
                                {item.status === 'AVAILABLE' ? 'Online' : item.status === 'BUSY' ? 'Active' : 'Offline'}
                            </Text>
                        </Pressable>
                    </Animated.View>
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    <View style={styles.emptyAgents}>
                        <Text style={styles.emptyText}>No active agents found</Text>
                    </View>
                )}
            />
        </View>
    );
});

// ─── Main Screen ───

export default function MerchantDashboardScreen() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollY = useSharedValue(0);

    const fetchDashboard = useCallback(async () => {
        try {
            const [dashRes, agentsRes] = await Promise.all([
                merchantApi.getDashboard(),
                merchantApi.getAgentStatusGrid(),
            ]);
            setDashboard(dashRes.data.dashboard);
            setAgents(agentsRes.data.agents);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 50], [0, 1], Extrapolate.CLAMP);
        const translateY = interpolate(scrollY.value, [0, 50], [-20, 0], Extrapolate.CLAMP);
        return { opacity, transform: [{ translateY }] };
    });

    const renderItem = ({ item }: { item: typeof DASHBOARD_SECTIONS[0] }) => {
        switch (item.type) {
            case 'hero':
                return <ImmersiveHero user={user} dashboard={dashboard} insets={insets} />;
            case 'revenue':
                return <RevenuePro dashboard={dashboard} />;
            case 'stats':
                return <BentoStatsGrid dashboard={dashboard} />;
            case 'actions':
                return <SmartActionGrid />;
            case 'network':
                return <NetworkPulse agents={agents} />;
            default:
                return null;
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* Standardized Header (Glassy on scroll) */}
            <Animated.View style={[styles.stickyHeader, { height: insets.top + 60 }, headerAnimatedStyle]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.smallHeaderTitle}>COMMAND CENTER</Text>
                    <View style={styles.headerIcons}>
                        <Pressable
                            style={styles.iconBtn}
                            onPress={() => router.push('/(merchant)/notifications')}
                        >
                            <Bell size={20} color="#111" />
                            <View style={styles.notifDot} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>

            <FlatList
                data={DASHBOARD_SECTIONS}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                        progressViewOffset={insets.top + 20}
                    />
                }
                onScroll={(e) => {
                    scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
            />
        </View>
    );
}

// ─── Helpers ───
function getTimeOfDay() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
}

// ─── Styles ───
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
    smallHeaderTitle: { fontSize: 13, fontWeight: '900', color: '#111', letterSpacing: 1.5 },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#FFF' },

    // Hero
    heroContainer: { minHeight: 280, paddingHorizontal: 24, paddingBottom: 30, position: 'relative' },
    heroGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    heroContent: { gap: 20 },
    greetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greetingLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
    businessName: { fontSize: 34, fontWeight: '900', color: '#111', letterSpacing: -1, marginTop: 4 },
    profileBtn: { position: 'relative' },
    avatarPlaceholder: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },

    quickStatusBox: { marginTop: 10 },
    glassCard: { flexDirection: 'row', padding: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
    statusItem: { flex: 1, alignItems: 'center', gap: 4 },
    statusIndicator: { width: 5, height: 5, borderRadius: 2.5, marginBottom: 2 },
    statusVal: { fontSize: 22, fontWeight: '900', color: '#111' },
    statusLab: { fontSize: 8, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
    statusDivider: { width: 1, height: '60%', backgroundColor: '#E2E8F0', alignSelf: 'center' },

    // Revenue Card
    revCardContainer: { paddingHorizontal: 24, marginTop: -20 },
    revCard: { borderRadius: 32, padding: 30, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    revLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    revLabel: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    revMain: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
    currencySymbol: { fontSize: 24, fontWeight: '900', color: Colors.primary, marginTop: 8, marginRight: 4 },
    revVal: { fontSize: 56, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
    revFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    trendStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trendVal: { fontSize: 15, fontWeight: '900', color: '#10B981' },
    trendLab: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    viewDetailedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailedText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
    revMesh: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.05 },

    // Bento Grid
    bentoGrid: { paddingHorizontal: 24, gap: 12, marginTop: 32 },
    bentoRow: { flexDirection: 'row', gap: 12 },
    bentoCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 28, padding: 24, gap: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    bentoIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    bentoVal: { fontSize: 24, fontWeight: '900', color: '#111' },
    bentoLab: { fontSize: 11, fontWeight: '700', color: '#64748B' },

    // Action Grid
    actionGridContainer: { marginTop: 40, paddingHorizontal: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#111', letterSpacing: 2, marginBottom: 20 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionItem: { width: (SCREEN_W - 48 - 24) / 3, alignItems: 'center', gap: 10, marginBottom: 10 },
    actionIconOuter: { width: 68, height: 68, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 11, fontWeight: '800', color: '#64748B' },

    // Network Pulse
    networkContainer: { marginTop: 40, paddingBottom: 20 },
    networkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 15 },
    seeAllText: { fontSize: 11, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    agentList: { paddingHorizontal: 24, gap: 15 },
    agentCard: { width: 100, backgroundColor: '#F8FAFC', borderRadius: 24, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    agentAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    agentInit: { fontSize: 18, fontWeight: '900', color: '#111' },
    agentStatus: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#F8FAFC' },
    agentName: { fontSize: 12, fontWeight: '800', color: '#111' },
    agentStatusText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
    emptyAgents: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
});
