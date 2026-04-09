import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/shared/EmptyState';

const AGENT_API = '/api/v1/agent';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    readAt: string | null;
    createdAt: string;
    deepLink?: string;
}

export default function AgentNotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get<{ notifications: Notification[] }>(AGENT_API + '/notifications');
            setNotifications(data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: string, deepLink?: string) => {
        try {
            await api.patch(AGENT_API + `/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
            if (deepLink) {
                // Handle deep linking logic here
                // router.push(deepLink);
            }
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_JOB': return 'briefcase-outline';
            case 'CHAT_MESSAGE': return 'chatbubble-outline';
            case 'STATUS_UPDATE': return 'checkmark-circle-outline';
            default: return 'notifications-outline';
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notifCard, !item.readAt && styles.unreadCard]}
            onPress={() => markAsRead(item.id, item.deepLink)}
        >
            <View style={styles.iconWrapper}>
                <Ionicons name={getIcon(item.type)} size={24} color={item.readAt ? Colors.textMuted : Colors.primary} />
            </View>
            <View style={styles.notifInfo}>
                <Text style={[styles.notifTitle, !item.readAt && styles.unreadText]}>{item.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            {!item.readAt && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="notifications-off-outline"
                            title="No notifications yet"
                            subtitle="Job updates and messages will appear here"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { marginRight: Spacing.md },
    title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: Spacing.md },
    notifCard: { flexDirection: 'row', padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, marginBottom: Spacing.sm, alignItems: 'center' },
    unreadCard: { backgroundColor: Colors.primary + '05' },
    iconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
    notifInfo: { flex: 1, marginLeft: Spacing.md },
    notifTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    unreadText: { fontWeight: '700' },
    notifBody: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    notifTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: Spacing.sm },
    empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
});
