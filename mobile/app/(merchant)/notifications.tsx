import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const MERCHANT = '/api/v1/merchant';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    deepLink: string | null;
    readAt: string | null;
    createdAt: string;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    NEW_ORDER: 'bag-handle',
    ORDER_STATUS: 'swap-horizontal',
    REVIEW_RECEIVED: 'star',
    AGENT_UPDATE: 'person',
    VERIFICATION_UPDATE: 'shield-checkmark',
    PROMOTION: 'pricetag',
    SYSTEM: 'information-circle',
};

const COLOR_MAP: Record<string, string> = {
    NEW_ORDER: Colors.primary,
    ORDER_STATUS: Colors.secondary,
    REVIEW_RECEIVED: Colors.warning,
    AGENT_UPDATE: '#9C27B0',
    VERIFICATION_UPDATE: Colors.success,
    PROMOTION: '#FF9800',
    SYSTEM: Colors.textSecondary,
};

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get<{ notifications: Notification[]; unreadCount: number }>(MERCHANT + '/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.patch(MERCHANT + `/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post(MERCHANT + '/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handlePress = (item: Notification) => {
        if (!item.readAt) handleMarkRead(item.id);
        if (item.deepLink) {
            router.push(item.deepLink as never);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        const icon = ICON_MAP[item.type] ?? 'notifications';
        const color = COLOR_MAP[item.type] ?? Colors.textSecondary;
        const isUnread = !item.readAt;

        return (
            <TouchableOpacity
                style={[styles.card, isUnread && styles.unreadCard]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, isUnread && styles.unreadTitle]}>{item.title}</Text>
                        {isUnread && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => unreadCount > 0 ? (
                        <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerBtn}>
                            <Text style={styles.markAllText}>Mark all read</Text>
                        </TouchableOpacity>
                    ) : null,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetch(); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptyText}>You have no notifications at the moment</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBtn: { paddingHorizontal: Spacing.sm },
    markAllText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
    list: { padding: Spacing.md, gap: Spacing.xs, paddingBottom: Spacing.xxl },

    card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
    unreadCard: { backgroundColor: Colors.primary + '06', borderLeftWidth: 3, borderLeftColor: Colors.primary },
    iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, flex: 1 },
    unreadTitle: { fontWeight: '800' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
    body: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
    time: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

    empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textMuted },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
