import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { customerApi, type Chat } from '../../lib/marketplace';
import { format } from 'date-fns';

export default function ChatScreen() {
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = async () => {
        try {
            const response = await customerApi.listChats();
            setChats(response.data.chats);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const renderChatItem = ({ item }: { item: Chat }) => {
        const lastMessage = item.messages[0];
        const participant = item.booking.agent?.user || item.booking.merchant;
        const participantName = participant?.name || 'Service Provider';
        const participantAvatar = participant?.avatarUrl;

        return (
            <Pressable
                style={styles.chatItem}
                onPress={() => router.push(`/(customer)/chat/${item.id}` as any)}
            >
                <View style={styles.avatarContainer}>
                    {participantAvatar ? (
                        <Image source={{ uri: participantAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={24} color={Colors.textMedium} />
                        </View>
                    )}
                    {item.isActive && <View style={styles.onlineBadge} />}
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.participantName} numberOfLines={1}>{participantName}</Text>
                        <Text style={styles.time}>
                            {lastMessage ? format(new Date(lastMessage.createdAt), 'h:mm a') : ''}
                        </Text>
                    </View>

                    <View style={styles.chatFooter}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {lastMessage?.content || 'Starting conversation...'}
                        </Text>
                        <View style={styles.bookingBadge}>
                            <Text style={styles.bookingText}>#{item.booking.bookingNumber}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                <Text style={styles.title}>Messages</Text>
                <Text style={styles.subtitle}>Chat with your service providers</Text>

                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptySubtitle}>Active bookings will show up here for communication.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    listContent: {
        paddingBottom: 160,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: Spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: 'white',
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textDark,
        flex: 1,
    },
    time: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: FontSize.sm,
        color: Colors.textMedium,
        flex: 1,
        marginRight: Spacing.sm,
    },
    bookingBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bookingText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textLight,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxl,
        marginTop: 100,
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
