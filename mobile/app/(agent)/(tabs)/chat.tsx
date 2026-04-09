import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, Image,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';

import { Colors, Spacing } from '../../../constants/theme';
import { agentApi } from '../../../lib/agent';
import { getImageUrl } from '../../../lib/api';
import EmptyState from '../../../components/shared/EmptyState';

interface ChatItem {
    id: string;
    bookingId: string;
    updatedAt: string;
    messages: { id: string; content: string; createdAt: string }[];
    participants: { user: { id: string; name: string; avatarUrl: string | null; role: string } }[];
    booking?: {
        bookingNumber?: string;
        customer?: { id: string; name: string; avatarUrl: string | null };
        merchant?: { id: string; name: string; avatarUrl: string | null };
    };
}

export default function AgentChatListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = useCallback(async () => {
        try {
            const res = await agentApi.listChats();
            setChats((res.data.chats ?? []) as ChatItem[]);
        } catch { setChats([]); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(
        useCallback(() => { fetchChats(); }, [fetchChats])
    );

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    };

    const renderItem = ({ item }: { item: ChatItem }) => {
        const lastMsg = item.messages[0];
        const otherParty = item.booking?.customer ?? item.booking?.merchant;
        const name = otherParty?.name ?? 'Unknown';
        const avatarUrl = otherParty?.avatarUrl;
        const bookingNum = item.booking?.bookingNumber;

        return (
            <Pressable
                style={({ pressed }) => [styles.chatCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push(`/(agent)/chat/${item.bookingId}` as any)}
            >
                <View style={styles.avatarWrap}>
                    {avatarUrl ? (
                        <Image source={{ uri: getImageUrl(avatarUrl) || '' }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={22} color="#94A3B8" />
                        </View>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.topRow}>
                        <Text style={styles.chatName} numberOfLines={1}>{name}</Text>
                        {lastMsg && (
                            <Text style={styles.chatTime}>{formatTime(lastMsg.createdAt)}</Text>
                        )}
                    </View>
                    {bookingNum && (
                        <Text style={styles.bookingNum}>#{bookingNum}</Text>
                    )}
                    <Text style={styles.lastMsg} numberOfLines={1}>
                        {lastMsg?.content ?? 'No messages yet'}
                    </Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchChats(); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="chatbubble-ellipses-outline"
                            title="No conversations yet"
                            subtitle="Chats with customers will appear here when you're assigned to jobs"
                        />
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
        paddingHorizontal: Spacing.lg, paddingBottom: 14,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },

    list: { padding: Spacing.lg, paddingBottom: 100, gap: 8 },

    chatCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, backgroundColor: '#FFF', borderRadius: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    avatarWrap: { width: 50, height: 50, borderRadius: 16, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: {
        width: '100%', height: '100%', backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', borderRadius: 16,
    },
    chatInfo: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
    chatTime: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
    bookingNum: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 2 },
    lastMsg: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 3 },
});
