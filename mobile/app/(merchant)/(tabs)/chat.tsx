import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, Image,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    MessageCircle,
    User as UserIcon,
    Hash,
} from 'lucide-react-native';
import { format } from 'date-fns';

import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi } from '../../../lib/merchant';

export default function MerchantChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = async () => {
        try {
            const response = await merchantApi.listChats();
            setChats(response.data.chats);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchChats(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchChats(); };

    const renderChatItem = ({ item, index }: { item: any; index: number }) => {
        const lastMessage = item.messages[0];
        const participant = item.participants.find((p: any) => p.user.role !== 'MERCHANT')?.user;
        const participantName = participant?.name || 'Customer';
        const participantAvatar = participant?.avatarUrl;

        return (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
                <Pressable
                    style={({ pressed }) => [styles.chatItem, pressed && { backgroundColor: '#F8FAFC' }]}
                    onPress={() => router.push(`/(merchant)/chat/${item.id}` as any)}
                >
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        {participantAvatar ? (
                            <Image source={{ uri: participantAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserIcon size={22} color={Colors.primary} strokeWidth={2} />
                            </View>
                        )}
                        {item.isActive && <View style={styles.onlineDot} />}
                    </View>

                    {/* Content */}
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
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Text style={styles.title}>Messages</Text>
                <Text style={styles.subtitle}>Chat with customers & agents</Text>
            </View>

            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <MessageCircle size={32} color="#CBD5E1" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptyHint}>Active conversations will appear here</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },

    listContent: { paddingBottom: 100 },

    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: Colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2.5,
        borderColor: '#F8FAFC',
    },

    chatContent: { flex: 1 },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    chatTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    chatBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatMessage: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    bookingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bookingTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },

    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 8,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    emptyHint: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
});
