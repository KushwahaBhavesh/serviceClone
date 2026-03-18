import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, Pressable,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react-native';
import { Colors, Spacing } from '../../../constants/theme';
import { merchantApi, type Chat as MerchantChat } from '../../../lib/merchant';

interface Sender { id: string; name: string | null; avatarUrl: string | null; role: string; }
interface Message { id: string; content: string; type: string; createdAt: string; sender: Sender; }

export default function ChatScreen() {
    const { id: bookingId } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [chat, setChat] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initChat = useCallback(async () => {
        try {
            const res = await merchantApi.openChat(bookingId);
            const c = res.data.chat;
            setChat(c);
            setMessages((c.messages ?? []).reverse());
        } catch { Alert.alert('Error', 'Could not open chat'); }
        finally { setLoading(false); }
    }, [bookingId]);

    const pollMessages = useCallback(async () => {
        if (!chat) return;
        try {
            const res = await merchantApi.getChatMessages(chat.id);
            setMessages(res.data.messages);
        } catch { /* silent */ }
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
            const res = await merchantApi.sendMessage(chat.id, msgText);
            setMessages((prev: Message[]) => [...prev, res.data.message]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            setText(msgText);
            Alert.alert('Error', 'Failed to send message');
        } finally { setSending(false); }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMerchant = item.sender.role === 'MERCHANT';
        return (
            <View style={[styles.bubble, isMerchant ? styles.myBubble : styles.otherBubble]}>
                {!isMerchant && (
                    <Text style={styles.senderName}>{item.sender.name ?? item.sender.role}</Text>
                )}
                <Text style={[styles.messageText, isMerchant && styles.myMessageText]}>{item.content}</Text>
                <Text style={[styles.messageTime, isMerchant && styles.myMessageTime]}>
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
                <Text style={styles.headerTitle}>Order Chat</Text>
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
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <MessageCircle size={32} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>Start the conversation</Text>
                            <Text style={styles.emptyHint}>Send a message to begin</Text>
                        </View>
                    }
                />

                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={2000}
                        placeholderTextColor="#CBD5E1"
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
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

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

    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    emptyHint: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
});
