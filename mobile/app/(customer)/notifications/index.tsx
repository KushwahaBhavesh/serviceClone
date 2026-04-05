import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Pressable, 
    RefreshControl, 
    ActivityIndicator,
    Platform 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
} from 'react-native-reanimated';
import { 
    Bell, 
    ChevronLeft, 
    Calendar, 
    MessageSquare, 
    Ticket, 
    Wallet, 
    BellOff,
    Sparkles,
    CheckCheck,
    ArrowRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { Colors, Spacing } from '../../../constants/theme';
import { customerApi, type Notification } from '../../../lib/marketplace';
import { useToast } from '../../../context/ToastContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showSuccess, showInfo } = useToast();
    
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await customerApi.markNotificationsRead();
            setUnreadCount(0);
            setNotifications(prev =>
                prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
            );
            showSuccess('Intelligence feed cleared.');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        Haptics.selectionAsync();
        if (notification.deepLink) {
            router.push(notification.deepLink as any);
        }
    };

    const getNotificationMeta = (type: string) => {
        switch (type) {
            case 'BOOKING_UPDATE': return { icon: Calendar, color: Colors.primary };
            case 'CHAT_MESSAGE': return { icon: MessageSquare, color: '#3B82F6' };
            case 'PROMO': return { icon: Ticket, color: '#10B981' };
            case 'WALLET': return { icon: Wallet, color: '#F59E0B' };
            default: return { icon: Bell, color: '#64748B' };
        }
    };

    const renderItem = ({ item, index }: { item: Notification, index: number }) => {
        const isUnread = !item.readAt;
        const { icon: Icon, color } = getNotificationMeta(item.type);

        return (
            <Animated.View entering={FadeInUp.delay(100 + index * 50).springify()}>
                <Pressable
                    style={({ pressed }) => [
                        styles.notificationCard,
                        isUnread && styles.unreadCard,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => handleNotificationPress(item)}
                >
                    {isUnread && <View style={styles.unreadAccent} />}
                    
                    <View style={[styles.iconBox, { backgroundColor: color + '10' }]}>
                        <Icon size={20} color={color} strokeWidth={2.5} />
                    </View>

                    <View style={styles.contentBox}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                                {item.title.toUpperCase()}
                            </Text>
                            <Text style={styles.timeText}>{format(new Date(item.createdAt), 'h:mm a')}</Text>
                        </View>
                        <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text>
                        
                        <View style={styles.footerRow}>
                            <View style={styles.typeBadge}>
                                <Text style={[styles.typeText, { color }]}>{item.type.replace('_', ' ')}</Text>
                            </View>
                            <ArrowRight size={14} color="#CBD5E1" strokeWidth={3} />
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* Sticky Oracle Header */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>INTELLIGENCE</Text>
                        <Text style={styles.headerSubtitle}>{unreadCount} new alerts</Text>
                    </View>
                    {unreadCount > 0 && (
                        <Pressable onPress={handleMarkAllRead} style={styles.actionBtn}>
                            <CheckCheck size={20} color={Colors.primary} strokeWidth={2.5} />
                        </Pressable>
                    )}
                    <Animated.View entering={FadeInRight} style={styles.oracleBadge}>
                        <Sparkles size={12} color={Colors.primary} strokeWidth={3} />
                        <Text style={styles.oracleBadgeText}>ORACLE</Text>
                    </Animated.View>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingTop: insets.top + 80, paddingBottom: 120 }
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <Animated.View entering={FadeInDown} style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <BellOff size={48} color="#CBD5E1" strokeWidth={1} />
                            </View>
                            <Text style={styles.emptyText}>SILENCE REGIMEN</Text>
                            <Text style={styles.emptySubText}>No intelligence reports currently available.</Text>
                        </Animated.View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Sticky Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    oracleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '20' },
    oracleBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    listContent: { paddingHorizontal: 20 },

    // Notification Cards
    notificationCard: { 
        flexDirection: 'row', 
        backgroundColor: '#FFF', 
        borderRadius: 28, 
        padding: 18, 
        marginBottom: 12, 
        borderWidth: 1.5, 
        borderColor: '#F1F5F9', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 15, 
        elevation: 2,
        overflow: 'hidden',
        position: 'relative'
    },
    unreadCard: { 
        backgroundColor: '#FFF', 
        borderColor: Colors.primary + '20',
        elevation: 4
    },
    unreadAccent: { 
        position: 'absolute', 
        left: 0, 
        top: 20, 
        bottom: 20, 
        width: 4, 
        backgroundColor: Colors.primary, 
        borderTopRightRadius: 4, 
        borderBottomRightRadius: 4 
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    contentBox: { flex: 1, marginLeft: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 },
    unreadTitle: { color: '#0F172A' },
    timeText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
    bodyText: { fontSize: 14, color: '#475569', fontWeight: '600', lineHeight: 20, marginBottom: 10 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F8FAFC' },
    typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyIconBox: { width: 110, height: 110, borderRadius: 45, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyText: { fontSize: 15, fontWeight: '900', color: '#64748B', letterSpacing: 2 },
    emptySubText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 10, textAlign: 'center' },
});
