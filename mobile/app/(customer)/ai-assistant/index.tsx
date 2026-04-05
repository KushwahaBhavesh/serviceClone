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
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInDown, 
    SlideInRight,
    SlideInLeft,
} from 'react-native-reanimated';
import { 
    ArrowLeft, 
    Send, 
    Sparkles, 
    ShieldCheck, 
    Zap,
    Info
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../../constants/theme';
import { customerApi } from '../../../lib/marketplace';
import { useAuthStore } from '../../../store/useAuthStore';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    createdAt: Date;
}

export default function AIAssistantScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    
    // Default to FREE if plan not set, matching persona requirements
    const userPlan = user?.plan || 'FREE';
    const userName = user?.name?.split(' ')[0] || 'Member';

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: `Hi ${userName}. I'm your concise AI assistant. How can I help you with your services today?`,
            sender: 'ai',
            createdAt: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            content: trimmed,
            sender: 'user',
            createdAt: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Context includes plan and name for the persona instructions
            const res = await customerApi.aiAssistant.chat(trimmed, {
                userName,
                userPlan
            });
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                content: res.data.reply,
                sender: 'ai',
                createdAt: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'ai',
                createdAt: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isAI = item.sender === 'ai';
        
        return (
            <Animated.View 
                entering={isAI ? SlideInLeft.springify() : SlideInRight.springify()} 
                style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}
            >
                <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                    <Text style={[styles.messageText, !isAI && { color: '#FFF' }]}>{item.content}</Text>
                    <Text style={[styles.timeText, !isAI && { color: 'rgba(255,255,255,0.6)' }]}>
                        {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.headerContent}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={20} color="#0F172A" strokeWidth={3} />
                    </Pressable>
                    <View style={styles.titleInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.headerTitle}>SMART ASSISTANT</Text>
                            <View style={[styles.planBadge, { backgroundColor: userPlan === 'FREE' ? '#F1F5F9' : Colors.primary + '15' }]}>
                                <Text style={[styles.planBadgeText, { color: userPlan === 'FREE' ? '#64748B' : Colors.primary }]}>{userPlan}</Text>
                            </View>
                        </View>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>ENCRYPTED CONVERSATION</Text>
                        </View>
                    </View>
                    <View style={styles.headerIcon}>
                        <Sparkles size={20} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.messageList, { paddingTop: insets.top + 80, paddingBottom: 120 }]}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            {/* Glassmorphic Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
                style={[styles.inputWrapper, { paddingBottom: insets.bottom + 15 }]}
            >
                <BlurView intensity={90} tint="light" style={styles.inputBlur}>
                    <View style={styles.inputInner}>
                        <TextInput
                            style={styles.textInput}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Type a message..."
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
            
            {userPlan === 'FREE' && (
                <Pressable 
                    style={[styles.upgradeBar, { bottom: insets.bottom + 85 }]}
                    onPress={() => router.push('/(customer)/profile/plans' as any)}
                >
                    <Zap size={14} color={Colors.primary} strokeWidth={3} />
                    <Text style={styles.upgradeText}>UPGRADE TO PRO FOR DETAILED ANSWERS</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { height: 75, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    titleInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    planBadgeText: { fontSize: 9, fontWeight: '900' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    statusText: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    messageList: { paddingHorizontal: 20 },
    messageRow: { marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    
    bubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
    userBubble: { backgroundColor: '#0F172A', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: '#F8FAFC', borderBottomLeftRadius: 4, borderWidth: 1.5, borderColor: '#F1F5F9' },
    
    messageText: { fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 20 },
    timeText: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textAlign: 'right', marginTop: 4 },

    inputWrapper: { position: 'absolute', bottom: 10, left: 10, right: 10 },
    inputBlur: { borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    inputInner: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 },
    textInput: { flex: 1, minHeight: 44, maxHeight: 100, fontSize: 14, fontWeight: '700', color: '#0F172A', paddingHorizontal: 15, paddingVertical: 8 },
    sendBtn: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
    sendBtnDisabled: { opacity: 0.5 },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    upgradeBar: { position: 'absolute', left: 25, right: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#F1F5F9', borderStyle: 'dashed' },
    upgradeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
