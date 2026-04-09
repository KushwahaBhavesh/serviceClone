import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Send, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { agentApi } from '../../../lib/agent';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocket } from '../../../hooks/useSocket';
import EmptyState from '../../../components/shared/EmptyState';

interface Sender { id: string; name: string | null; avatarUrl: string | null; role: string; }
interface Message { id: string; content: string; type: string; createdAt: string; sender: Sender; chatId?: string; }

export default function AgentChatScreen() {
    const { id: bookingId } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    const [chat, setChat] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [othersTyping, setOthersTyping] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { joinChat, leaveChat, onChatMessage, onTyping, sendTyping } = useSocket();

    const initChat = useCallback(async () => {
        try {
            const res = await agentApi.openChat(bookingId);
            const c = res.data.chat;
            setChat(c);
            setMessages((c.messages ?? []).reverse());
        } catch {
            console.error('Chat init error');
        } finally { setLoading(false); }
    }, [bookingId]);

    // Init + join socket room
    useEffect(() => { initChat(); }, [initChat]);

    useEffect(() => {
        if (!chat) return;
        joinChat(chat.id);
        return () => { leaveChat(chat.id); };
    }, [chat?.id]);

    // Real-time message + typing listeners
    useEffect(() => {
        if (!chat) return;
        const cleanupMsg = onChatMessage((msg: Message) => {
            if (msg.sender?.id !== user?.id) {
                setMessages(prev => [...prev, msg]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        });
        const cleanupTyping = onTyping((data) => {
            if (data.chatId === chat.id && data.userId !== user?.id) {
                setOthersTyping(data.isTyping);
            }
        });
        return () => { cleanupMsg(); cleanupTyping(); };
    }, [chat?.id, user?.id]);

    const handleTextChange = (value: string) => {
        setText(value);
        if (chat) sendTyping(chat.id, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (chat) sendTyping(chat.id, false);
        }, 1500);
    };

    const handleSend = async () => {
        if (!text.trim() || !chat) return;
        setSending(true);
        const msgText = text.trim();
        setText('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const res = await agentApi.sendMessage(chat.id, msgText);
            setMessages(prev => [...prev, res.data.message]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            setText(msgText);
        } finally { setSending(false); }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender.id === user?.id;
        return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                {!isMine && (
                    <Text style={styles.senderName}>{item.sender.name ?? item.sender.role}</Text>
                )}
                <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.content}</Text>
                <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                    {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                >
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Job Chat</Text>
                    {othersTyping && (
                        <Text style={styles.typingText}>typing...</Text>
                    )}
                </View>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <EmptyState
                            icon="chatbubbles-outline"
                            title="Start the conversation"
                            subtitle="Send a message to begin"
                        />
                    }
                />
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={text}
                        onChangeText={handleTextChange}
                        multiline
                        maxLength={2000}
                        placeholderTextColor={Colors.textMuted}
                    />
                    <Pressable
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Send size={18} color="#FFF" strokeWidth={2.5} />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 10,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
    typingText: { fontSize: 12, fontWeight: '600', color: Colors.primary, textAlign: 'center', marginTop: 2 },

    messageList: { padding: Spacing.lg, paddingBottom: Spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },

    bubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 6 },
    myBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    otherBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    senderName: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
    messageText: { fontSize: 14, color: '#0F172A', lineHeight: 20, fontWeight: '500' },
    myMessageText: { color: '#FFF' },
    messageTime: { fontSize: 10, color: '#94A3B8', marginTop: 6, alignSelf: 'flex-end' },
    myMessageTime: { color: 'rgba(255,255,255,0.6)' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    input: {
        flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: '#0F172A', fontWeight: '500', maxHeight: 100, minHeight: 44,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.35 },
});
