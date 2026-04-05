import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, Image,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    MessageCircle,
    User as UserIcon,
    Hash,
} from 'lucide-react-native';
import { format } from 'date-fns';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';

interface ChatParticipant {
    user: { id: string; name: string; role: string; avatarUrl?: string };
}

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
}

interface Chat {
    id: string;
    isActive: boolean;
    participants: ChatParticipant[];
    messages: ChatMessage[];
    unreadCount?: number;
    booking?: { bookingNumber: string };
}

export default function MerchantChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = useCallback(async () => {
        try {
            const response = await merchantApi.listChats();
            setChats(response.data.chats);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchChats(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchChats(); };

    const renderChatItem = useCallback(({ item, index }: { item: Chat; index: number }) => {
        const lastMessage = item.messages[0];
        const participant = item.participants.find((p) => p.user.role !== 'MERCHANT')?.user;
        const participantName = participant?.name || 'Customer';
        const participantAvatar = participant?.avatarUrl;

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
                <Pressable
                    style={({ pressed }) => [styles.chatItem, pressed && { backgroundColor: '#F1F5F9' }]}
                    onPress={() => router.push(`/(merchant)/chat/${item.id}` as any)}
                >
                    <View style={styles.avatarWrap}>
                        {participantAvatar ? (
                            <Image source={{ uri: participantAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserIcon size={24} color={Colors.primary} strokeWidth={2} />
                            </View>
                        )}
                        {item.isActive && <View style={styles.onlineDot} />}
                    </View>

                    <View style={styles.chatContent}>
                        <View style={styles.chatTopRow}>
                            <Text style={styles.chatName} numberOfLines={1}>{participantName}</Text>
                            <Text style={styles.chatTime}>
                                {lastMessage ? format(new Date(lastMessage.createdAt), 'h:mm a') : ''}
                            </Text>
                        </View>
                        <View style={styles.chatBottomRow}>
                            <Text style={styles.chatMessage} numberOfLines={1}>
                                {lastMessage?.content || 'Starting conversation...'}
                            </Text>
                            {item.booking?.bookingNumber && (
                                <View style={styles.bookingTag}>
                                    <Hash size={9} color="#94A3B8" strokeWidth={2.5} />
                                    <Text style={styles.bookingTagText}>{item.booking.bookingNumber}</Text>
                                </View>
                            )}
                            {item.unreadCount && item.unreadCount > 0 && (
                                <View style={styles.unreadPill}>
                                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, [router]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            
            {/* ─── Sticky Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={styles.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Text style={styles.title}>Messages</Text>
                    <View style={styles.activeBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.activeLabel}>LIVE</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={Colors.primary} 
                        colors={[Colors.primary]} 
                        progressViewOffset={insets.top + 60}
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <MessageCircle size={32} color="#CBD5E1" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptyHint}>Active conversations will appear here</Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: insets.top + 70 }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

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
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.success,
    },
    activeLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },

    listContent: { paddingBottom: 120 },

    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: 18,
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFF',
        marginBottom: 1,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 3,
        borderColor: '#FFF',
    },

    chatContent: { flex: 1 },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.2,
    },
    chatTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
    },
    chatBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    chatMessage: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    bookingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bookingTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
    },
    unreadPill: {
        backgroundColor: Colors.primary,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
    },

    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 120,
        gap: 8,
    },
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#334155',
    },
    emptyHint: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
