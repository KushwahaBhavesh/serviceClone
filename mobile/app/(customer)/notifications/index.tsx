import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { customerApi, type Notification } from '../../../lib/marketplace';
import { format } from 'date-fns';

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await customerApi.listNotifications();
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await customerApi.markNotificationsRead();
            setUnreadCount(0);
            setNotifications(prev =>
                prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (notification.deepLink) {
            router.push(notification.deepLink as any);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const isUnread = !item.readAt;

        return (
            <Pressable
                style={[styles.notificationItem, isUnread && styles.unreadItem]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
                    <Ionicons
                        name={getNotificationIcon(item.type)}
                        size={22}
                        color={getNotificationColor(item.type)}
                    />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, isUnread && styles.unreadText]}>{item.title}</Text>
                        <Text style={styles.time}>{format(new Date(item.createdAt), 'h:mm a')}</Text>
                    </View>
                    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                </View>

                {isUnread && <View style={styles.unreadDot} />}
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: 'white' },
                    headerRight: () =>
                        unreadCount > 0 ? (
                            <Pressable onPress={handleMarkAllRead} style={{ marginRight: Spacing.md }}>
                                <Text style={{ color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' }}>
                                    Mark All Read
                                </Text>
                            </Pressable>
                        ) : null,
                }}
            />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={Colors.textLight} />
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptySubtitle}>We'll let you know when something important happens.</Text>
                    </View>
                }
                contentContainerStyle={notifications.length === 0 && { flex: 1 }}
            />
        </View>
    );
}

const getNotificationIcon = (type: string): any => {
    switch (type) {
        case 'BOOKING_UPDATE': return 'calendar';
        case 'CHAT_MESSAGE': return 'chatbubble-ellipses';
        case 'PROMO': return 'pricetag';
        case 'WALLET': return 'wallet';
        default: return 'notifications';
    }
};

const getNotificationColor = (type: string): string => {
    switch (type) {
        case 'BOOKING_UPDATE': return Colors.primary;
        case 'CHAT_MESSAGE': return '#2563EB';
        case 'PROMO': return '#059669';
        case 'WALLET': return '#D97706';
        default: return Colors.textMedium;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: Colors.primary + '05',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: FontSize.md,
        fontWeight: '500',
        color: Colors.textDark,
        flex: 1,
    },
    unreadText: {
        fontWeight: '700',
    },
    time: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
        marginLeft: Spacing.sm,
    },
    body: {
        fontSize: FontSize.sm,
        color: Colors.textMedium,
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginLeft: Spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxl,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.textDark,
        marginTop: Spacing.lg,
    },
    emptySubtitle: {
        fontSize: FontSize.md,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
});
