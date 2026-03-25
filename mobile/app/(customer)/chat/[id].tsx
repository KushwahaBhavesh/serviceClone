import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { customerApi, type ChatMessage } from '../../../lib/marketplace';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocket } from '../../../hooks/useSocket';
import { format, isToday, isYesterday } from 'date-fns';

export default function ChatDetailScreen() {
    const { id: chatId } = useLocalSearchParams<{ id: string }>();
    const user = useAuthStore((s) => s.user);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [othersTyping, setOthersTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { joinChat, leaveChat, onChatMessage, onTyping, sendTyping } = useSocket();

    const fetchMessages = useCallback(async (pageNum = 1) => {
        if (!chatId) return;
        try {
            const res = await customerApi.getChatMessages(chatId, { page: pageNum, limit: 50 });
            if (pageNum === 1) {
                setMessages(res.data.messages);
            } else {
                setMessages((prev) => [...res.data.messages, ...prev]);
            }
            setHasMore(pageNum < res.data.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    useEffect(() => {
        fetchMessages();
        if (chatId) joinChat(chatId as string);
        return () => {
            if (chatId) leaveChat(chatId as string);
        };
    }, [fetchMessages, chatId, joinChat, leaveChat]);

    // Listen for real-time messages & typing
    useEffect(() => {
        const cleanupMsg = onChatMessage((msg: ChatMessage) => {
            if (msg.chatId === chatId && msg.sender.id !== user?.id) {
                setMessages(prev => [...prev, msg]);
            }
        });

        const cleanupTyping = onTyping((data: { chatId: string; userId: string; isTyping: boolean }) => {
            if (data.chatId === chatId && data.userId !== user?.id) {
                setOthersTyping(data.isTyping);
            }
        });

        return () => {
            cleanupMsg();
            cleanupTyping();
        };
    }, [chatId, onChatMessage, onTyping, user?.id]);

    const handleTextChange = (text: string) => {
        setInput(text);
        if (!isTyping && chatId) {
            setIsTyping(true);
            sendTyping(chatId as string, true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (chatId) sendTyping(chatId as string, false);
        }, 1500);
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending || !chatId) return;

        setSending(true);
        setInput('');

        // Optimistic update
        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            chatId,
            content: trimmed,
            createdAt: new Date().toISOString(),
            sender: {
                id: user?.id || '',
                name: user?.name || 'You',
                avatarUrl: user?.avatarUrl || null,
                role: 'CUSTOMER',
            },
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const res = await customerApi.sendMessage(chatId, trimmed);
            // Replace optimistic message with real one
            setMessages((prev) =>
                prev.map((m) => (m.id === optimisticMsg.id ? res.data.message : m)),
            );
        } catch (error) {
            // Remove optimistic message on failure
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            setInput(trimmed);
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'h:mm a');
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    };

    const shouldShowDateSeparator = (index: number) => {
        if (index === 0) return true;
        const current = new Date(messages[index].createdAt).toDateString();
        const previous = new Date(messages[index - 1].createdAt).toDateString();
        return current !== previous;
    };

    const isMyMessage = (msg: ChatMessage) => msg.sender.id === user?.id;

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isMine = isMyMessage(item);
        const showDate = shouldShowDateSeparator(index);

        return (
            <View>
                {showDate && (
                    <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
                        <View style={styles.dateLine} />
                    </View>
                )}
                <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
                    {!isMine && (
                        <View style={styles.senderAvatar}>
                            {item.sender.avatarUrl ? (
                                <Image source={{ uri: item.sender.avatarUrl }} style={styles.miniAvatar} />
                            ) : (
                                <View style={styles.miniAvatarPlaceholder}>
                                    <Ionicons name="person" size={14} color={Colors.textMuted} />
                                </View>
                            )}
                        </View>
                    )}
                    <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                        {!isMine && (
                            <Text style={styles.senderName}>{item.sender.name || 'Unknown'}</Text>
                        )}
                        {item.type === 'IMAGE' ? (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
                                <Text style={styles.imagePlaceholderText}>Image Attachment</Text>
                            </View>
                        ) : (
                            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                                {item.content}
                            </Text>
                        )}
                        <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                            {formatMessageTime(item.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Chat', headerShown: true, headerShadowVisible: false }} />
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <Stack.Screen
                options={{
                    title: 'Chat',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptySubtitle}>Send a message to get started</Text>
                    </View>
                }
                ListFooterComponent={
                    othersTyping ? (
                        <View style={styles.typingIndicator}>
                            <Text style={styles.typingText}>Provider is typing...</Text>
                        </View>
                    ) : null
                }
            />

            < View style={styles.inputBar} >
                <Pressable style={styles.mediaButton} onPress={() => { }}>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </Pressable>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={handleTextChange}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={1000}
                />
                <Pressable
                    style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!input.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="send" size={20} color="white" />
                    )}
                </Pressable>
            </View >
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundAlt,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    messageList: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        flexGrow: 1,
    },
    // ─── Date Separator ───
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    dateLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dateText: {
        marginHorizontal: Spacing.sm,
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    // ─── Message Row ───
    messageRow: {
        flexDirection: 'row',
        marginBottom: Spacing.xs,
        alignItems: 'flex-end',
    },
    myRow: {
        justifyContent: 'flex-end',
    },
    theirRow: {
        justifyContent: 'flex-start',
    },
    senderAvatar: {
        marginRight: Spacing.xs,
        marginBottom: 2,
    },
    miniAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    miniAvatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ─── Bubble ───
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24, // Consistent premium rounding
    },
    myBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    theirBubble: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    senderName: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 2,
    },
    messageText: {
        fontSize: FontSize.md,
        color: Colors.text,
        lineHeight: 22,
    },
    myMessageText: {
        color: Colors.textOnPrimary,
    },
    messageTime: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    // ─── Input Bar ───
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    },
    mediaButton: {
        width: 48,
        height: 48,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    input: {
        flex: 1,
        minHeight: 48,
        maxHeight: 120,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    // ─── Empty ───
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.text,
        marginTop: Spacing.md,
    },
    emptySubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    typingIndicator: {
        padding: Spacing.sm,
        alignItems: 'flex-start',
        marginLeft: 40,
    },
    typingText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    imagePlaceholder: {
        width: 150,
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    imagePlaceholderText: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 4,
    },
});
