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
    Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeIn,
    SlideInRight,
    SlideInLeft,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { 
    ArrowLeft, 
    Send, 
    Plus, 
    Image as ImageIcon, 
    Paperclip, 
    MoreHorizontal, 
    User, 
    ShieldCheck, 
    Zap,
    Sparkles,
    Check,
    CheckCheck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, isToday, isYesterday } from 'date-fns';

import { Colors, Spacing } from '../../../constants/theme';
import { customerApi, type ChatMessage } from '../../../lib/marketplace';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocket } from '../../../hooks/useSocket';
import { getImageUrl } from '../../../lib/api';

const { width } = Dimensions.get('window');

export default function ChatDetailScreen() {
    const { id: chatId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [othersTyping, setOthersTyping] = useState(false);
    
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { joinChat, leaveChat, onChatMessage, onTyping, sendTyping } = useSocket();

    const fetchMessages = useCallback(async () => {
        if (!chatId) return;
        try {
            const res = await customerApi.getChatMessages(chatId, { page: 1, limit: 100 });
            setMessages(res.data.messages);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [chatId]);

    useEffect(() => {
        fetchMessages();
        if (chatId) joinChat(chatId as string);
        return () => { if (chatId) leaveChat(chatId as string); };
    }, [fetchMessages, chatId]);

    useEffect(() => {
        const cleanupMsg = onChatMessage((msg: ChatMessage) => {
            if (msg.chatId === chatId && msg.sender.id !== user?.id) {
                setMessages(prev => [...prev, msg]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        });
        const cleanupTyping = onTyping((data) => {
            if (data.chatId === chatId && data.userId !== user?.id) {
                setOthersTyping(data.isTyping);
            }
        });
        return () => { cleanupMsg(); cleanupTyping(); };
    }, [chatId, user?.id]);

    const handleTextChange = (text: string) => {
        setInput(text);
        if (chatId) sendTyping(chatId as string, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (chatId) sendTyping(chatId as string, false);
        }, 1500);
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending || !chatId) return;
        setSending(true);
        setInput('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const res = await customerApi.sendMessage(chatId, trimmed);
            setMessages(prev => [...prev, res.data.message]);
        } catch { /* error handling */ }
        finally { setSending(false); }
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isMine = item.sender.id === user?.id;
        
        return (
            <Animated.View 
                entering={isMine ? SlideInRight.springify() : SlideInLeft.springify()} 
                style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}
            >
                {!isMine && (
                    <View style={styles.senderAvatar}>
                        {item.sender.avatarUrl ? (
                            <Image source={{ uri: getImageUrl(item.sender.avatarUrl) || '' }} style={styles.miniAvatar} />
                        ) : (
                            <View style={styles.miniAvatarPlaceholder}><User size={12} color="#94A3B8" /></View>
                        )}
                    </View>
                )}
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMine && { color: '#FFF' }]}>{item.content}</Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.6)' }]}>
                            {format(new Date(item.createdAt), 'HH:mm')}
                        </Text>
                        {isMine && <CheckCheck size={12} color="rgba(255,255,255,0.8)" />}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Glassmorphic Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.headerContent}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={20} color="#0F172A" strokeWidth={3} />
                    </Pressable>
                    <View style={styles.expertBrief}>
                        <Text style={styles.expertName}>MISSION SUPPORT</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: othersTyping ? Colors.primary : Colors.success }]} />
                            <Text style={styles.statusText}>{othersTyping ? 'TYPING...' : 'SECURE LINE ACTIVE'}</Text>
                        </View>
                    </View>
                    <View style={styles.shieldBadge}><ShieldCheck size={16} color={Colors.success} strokeWidth={3} /></View>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.messageList, { paddingTop: insets.top + 70, paddingBottom: 100 }]}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            {/* Glassmorphic Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
                style={[styles.inputWrapper, { paddingBottom: insets.bottom + 10 }]}
            >
                <BlurView intensity={90} tint="light" style={styles.inputBlur}>
                    <View style={styles.inputInner}>
                        <Pressable style={styles.attachmentBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                            <Plus size={20} color={Colors.primary} strokeWidth={3} />
                        </Pressable>
                        <TextInput
                            style={styles.textInput}
                            value={input}
                            onChangeText={handleTextChange}
                            placeholder="COMMENCE TRANSMISSION..."
                            placeholderTextColor="#94A3B8"
                            multiline
                        />
                        <Pressable 
                            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
                            onPress={handleSend}
                            disabled={!input.trim() || sending}
                        >
                            <LinearGradient 
                                colors={[Colors.primary, '#FF7A00']} 
                                style={styles.sendGradient}
                            >
                                {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={18} color="#FFF" strokeWidth={3} />}
                            </LinearGradient>
                        </Pressable>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    
    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { height: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    expertBrief: { flex: 1 },
    expertName: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    shieldBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.success + '10', justifyContent: 'center', alignItems: 'center' },

    messageList: { paddingHorizontal: 20 },
    messageRow: { marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    myRow: { justifyContent: 'flex-end' },
    theirRow: { justifyContent: 'flex-start' },
    
    senderAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F1F5F9', overflow: 'hidden' },
    miniAvatar: { width: '100%', height: '100%' },
    miniAvatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
    myBubble: { backgroundColor: '#0F172A', borderBottomRightRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 },
    theirBubble: { backgroundColor: '#F8FAFC', borderBottomLeftRadius: 4, borderWidth: 1.5, borderColor: '#F1F5F9' },
    
    messageText: { fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 20 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
    timeText: { fontSize: 9, fontWeight: '700', color: '#94A3B8' },

    // Input
    inputWrapper: { position: 'absolute', bottom: 10, left: 10, right: 10 },
    inputBlur: { borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
    inputInner: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 },
    attachmentBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    textInput: { flex: 1, minHeight: 44, maxHeight: 100, fontSize: 13, fontWeight: '700', color: '#0F172A', paddingHorizontal: 10, paddingVertical: 8 },
    sendBtn: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
    sendBtnDisabled: { opacity: 0.5 },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
