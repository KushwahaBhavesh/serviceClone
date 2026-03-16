import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

const AGENT_API = '/api/v1/agent';

interface Sender {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
}

interface Message {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: Sender;
}

interface Participant {
    id: string;
    userId: string;
    user: Sender;
}

interface Chat {
    id: string;
    bookingId: string;
    messages: Message[];
    participants: Participant[];
}

export default function AgentChatScreen() {
    const { id: bookingId } = useLocalSearchParams<{ id: string }>();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initChat = useCallback(async () => {
        try {
            const res = await api.post<{ chat: Chat }>(AGENT_API + `/chat/open/${bookingId}`);
            const c = res.data.chat;
            setChat(c);
            // Reverse messages for standard chat display (bottom up)
            setMessages((c.messages ?? []).reverse());
        } catch (error) {
            console.error('Chat init error:', error);
            Alert.alert('Error', 'Could not open chat');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    const pollMessages = useCallback(async () => {
        if (!chat) return;
        try {
            const res = await api.get<{ messages: Message[] }>(AGENT_API + `/chat/${chat.id}/messages`);
            setMessages(res.data.messages);
        } catch { /* silent polling */ }
    }, [chat]);

    useEffect(() => { initChat(); }, [initChat]);

    useEffect(() => {
        if (!chat) return;
        pollRef.current = setInterval(pollMessages, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [chat, pollMessages]);

    const handleSend = async () => {
        if (!text.trim() || !chat) return;
        setSending(true);
        const msgText = text.trim();
        setText('');
        try {
            const res = await api.post<{ message: Message }>(AGENT_API + `/chat/${chat.id}/messages`, { content: msgText });
            setMessages(prev => [...prev, res.data.message]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            setText(msgText);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        // Find if this message is from the current user (Agent)
        // Note: sender.id should be the current user's ID. 
        // For now, simpler heuristic: if role is AGENT, it's "mine" (or use user store if available)
        const isMe = item.sender.role === 'AGENT';

        return (
            <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                {!isMe && (
                    <Text style={styles.senderName}>{item.sender.name ?? item.sender.role}</Text>
                )}
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
                <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                    {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Chat',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>Start the conversation</Text>
                        </View>
                    }
                />
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={2000}
                        placeholderTextColor={Colors.textMuted}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={Colors.textOnPrimary} />
                        ) : (
                            <Ionicons name="send" size={18} color={Colors.textOnPrimary} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBtn: { paddingHorizontal: Spacing.sm },
    messageList: { padding: Spacing.md, paddingBottom: Spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },

    bubble: { maxWidth: '80%', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.xs },
    myBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    otherBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
    senderName: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
    messageText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
    myMessageText: { color: Colors.textOnPrimary },
    messageTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
    myMessageTime: { color: Colors.textOnPrimary + '80' },

    inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
    input: { flex: 1, backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.text, maxHeight: 100, minHeight: 40 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { opacity: 0.4 },

    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
