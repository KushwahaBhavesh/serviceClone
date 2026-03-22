import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    ChevronLeft, ShoppingBag, ArrowLeftRight, Star,
    User, ShieldCheck, Tag, Info, BellOff,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { MerchantNotification } from '../../lib/merchant';


const ICON_MAP: Record<string, React.ReactNode> = {
    NEW_ORDER: <ShoppingBag size={18} color={Colors.primary} strokeWidth={2} />,
    ORDER_STATUS: <ArrowLeftRight size={18} color="#6366F1" strokeWidth={2} />,
    REVIEW_RECEIVED: <Star size={18} color="#F59E0B" fill="#F59E0B" />,
    AGENT_UPDATE: <User size={18} color="#A855F7" strokeWidth={2} />,
    VERIFICATION_UPDATE: <ShieldCheck size={18} color="#10B981" strokeWidth={2} />,
    PROMOTION: <Tag size={18} color="#F97316" strokeWidth={2} />,
    SYSTEM: <Info size={18} color="#64748B" strokeWidth={2} />,
};

const COLOR_MAP: Record<string, string> = {
    NEW_ORDER: Colors.primary, ORDER_STATUS: '#6366F1',
    REVIEW_RECEIVED: '#F59E0B', AGENT_UPDATE: '#A855F7',
    VERIFICATION_UPDATE: '#10B981', PROMOTION: '#F97316', SYSTEM: '#64748B',
};

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [notifications, setNotifications] = useState<MerchantNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            const res = await merchantApi.listNotifications();
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch { setNotifications([]); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMarkRead = async (id: string) => {
        try {
            await merchantApi.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await merchantApi.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
            setUnreadCount(0);
        } catch {}
    };

    const handlePress = (item: MerchantNotification) => {
        if (!item.readAt) handleMarkRead(item.id);
        if (item.deepLink) router.push(item.deepLink as never);
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const renderNotification = ({ item, index }: { item: MerchantNotification; index: number }) => {
        const icon = ICON_MAP[item.type] ?? <Info size={18} color="#64748B" strokeWidth={2} />;
        const color = COLOR_MAP[item.type] ?? '#64748B';
        const isUnread = !item.readAt;

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                    style={[styles.card, isUnread && styles.unreadCard]}
                    onPress={() => handlePress(item)}
                >
                    <View style={[styles.iconCircle, { backgroundColor: color + '14' }]}>
                        {icon}
                    </View>
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
                            {isUnread && <View style={[styles.dot, { backgroundColor: color }]} />}
                        </View>
                        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 ? (
                    <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </Pressable>
                ) : <View style={{ width: 44 }} />}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }}
                            colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <BellOff size={32} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptyHint}>You have no notifications at the moment</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A' },
    markAllBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.primary + '12' },
    markAllText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

    list: { padding: Spacing.lg, gap: 8, paddingBottom: 40 },

    card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        padding: 16, backgroundColor: '#FFF', borderRadius: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    unreadCard: { backgroundColor: Colors.primary + '05', borderLeftWidth: 3, borderLeftColor: Colors.primary },
    iconCircle: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
    unreadTitle: { fontWeight: '800' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    body: { fontSize: 13, color: '#64748B', marginTop: 2, lineHeight: 18, fontWeight: '500' },
    time: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },

    empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    emptyHint: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
});
