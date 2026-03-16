import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { merchantApi, type Chat } from '../../../lib/merchant';
import { format } from 'date-fns';

export default function MerchantChatScreen() {
    const router = useRouter();
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

    useEffect(() => {
        fetchChats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const renderChatItem = ({ item }: { item: any }) => {
        const lastMessage = item.messages[0];
        // For merchant, the "other" participant is usually the customer or agent
        // We look for participants who are NOT merchants
        const participant = item.participants.find((p: any) => p.user.role !== 'MERCHANT')?.user;
        const participantName = participant?.name || 'Customer';
        const participantAvatar = participant?.avatarUrl;

        return (
            <Pressable
                style={styles.chatItem}
                onPress={() => router.push(`/(merchant)/chat/${item.id}` as any)}
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
                            <Text style={styles.bookingText}>#{item.booking?.bookingNumber}</Text>
                        </View>
                    </View>
                </View>
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
                <Text style={styles.subtitle}>Chat with customers and agents</Text>
            </View>

            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptySubtitle}>Your active conversations will appear here.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    listContent: {
        paddingBottom: Spacing.xxl,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
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
        backgroundColor: Colors.backgroundAlt,
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
        color: Colors.text,
        flex: 1,
    },
    time: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        flex: 1,
        marginRight: Spacing.sm,
    },
    bookingBadge: {
        backgroundColor: Colors.backgroundAlt,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bookingText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textMuted,
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
        color: Colors.text,
        marginTop: Spacing.lg,
    },
    emptySubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
});
