import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    Image as RNImage,
    Dimensions,
    Modal,
    ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeIn,
    SlideInRight,
    SlideInLeft,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    Layout,
    ZoomIn,
    ZoomOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { 
    ArrowLeft, 
    Send, 
    Plus, 
    User, 
    ShieldCheck, 
    CheckCheck,
    Phone,
    MoreHorizontal,
    Image as ImageIcon,
    FileText,
    X,
    Maximize2,
    Download,
    File,
    Paperclip
} from 'lucide-react-native';

import { Colors } from '../../../constants/theme';
import { customerApi, type ChatMessage, type Chat } from '../../../lib/marketplace';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSocket } from '../../../hooks/useSocket';
import { getImageUrl } from '../../../lib/api';
import { cdnService } from '../../../lib/cdn';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * COMPLETE CHAT MEDIA REDESIGN
 * - Features: Image/Document uploading, Preview Zone, Lightbox, Clean Pro Support UI
 */
export default function ChatDetailScreen() {
    const { id: chatId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [othersTyping, setOthersTyping] = useState(false);
    
    // Media State
    const [pendingAttachment, setPendingAttachment] = useState<{ uri: string; name: string; type: 'IMAGE' | 'DOCUMENT'; mimeType?: string } | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { joinChat, leaveChat, onChatMessage, onTyping, sendTyping } = useSocket();

    // ─── Data Initialization ───

    const fetchInitialData = useCallback(async () => {
        if (!chatId) return;
        try {
            const [msgRes, chatsRes] = await Promise.all([
                customerApi.getChatMessages(chatId, { page: 1, limit: 100 }),
                customerApi.listChats()
            ]);
            setMessages(msgRes.data.messages);
            const currentChat = chatsRes.data.chats.find((c: Chat) => c.id === chatId);
            if (currentChat) setChat(currentChat);
        } catch (err) {
            console.error('Chat data fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    useEffect(() => {
        fetchInitialData();
        if (chatId) joinChat(chatId as string);
        return () => { if (chatId) leaveChat(chatId as string); };
    }, [fetchInitialData, chatId]);

    useEffect(() => {
        const cleanupMsg = onChatMessage((msg: ChatMessage) => {
            if (msg.chatId === chatId && msg.sender.id !== user?.id) {
                setMessages(prev => [...prev, msg]);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        });
        const cleanupTyping = onTyping((data) => {
            if (data.chatId === chatId && data.userId !== user?.id) {
                setOthersTyping(data.isTyping);
            }
        });
        return () => { cleanupMsg(); cleanupTyping(); };
    }, [chatId, user?.id]);

    // ─── Media Picking Logic ───

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setPendingAttachment({
                uri: asset.uri,
                name: asset.fileName || `img_${Date.now()}.jpg`,
                type: 'IMAGE',
                mimeType: asset.mimeType || 'image/jpeg'
            });
            setShowAttachmentMenu(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handlePickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setPendingAttachment({
                uri: asset.uri,
                name: asset.name,
                type: 'DOCUMENT',
                mimeType: asset.mimeType
            });
            setShowAttachmentMenu(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    // ─── Interaction Handlers ───

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
        if ((!trimmed && !pendingAttachment) || sending || !chatId) return;
        
        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            let fileUrl = undefined;
            let fileName = undefined;
            let messageType: any = 'TEXT';

            // 1. Handle actual upload if attachment exists
            if (pendingAttachment) {
                const uploadRes = await cdnService.uploadSingle({
                    uri: pendingAttachment.uri,
                    name: pendingAttachment.name,
                    type: pendingAttachment.mimeType || 'application/octet-stream'
                });
                fileUrl = uploadRes.url;
                fileName = pendingAttachment.name;
                messageType = pendingAttachment.type;
            }

            // 2. Send message to API
            const res = await customerApi.sendMessage(
                chatId, 
                trimmed || (messageType === 'IMAGE' ? 'Sent an image' : 'Sent a document'), 
                messageType, 
                fileUrl, 
                fileName
            );
            
            setMessages(prev => [...prev, res.data.message]);
            setInput('');
            setPendingAttachment(null);
        } catch (err) {
            console.error('Send error:', err);
            // Show alert or toast
        } finally {
            setSending(false);
        }
    };

    // ─── UI Rendering Helpers ───

    const merchantInfo = useMemo(() => {
        if (!chat?.booking?.merchant) return null;
        return chat.booking.merchant;
    }, [chat]);

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isMine = item.sender.id === user?.id;
        const nextIsSame = index < messages.length - 1 && messages[index + 1]?.sender.id === item.sender.id;
        
        return (
            <Animated.View 
                entering={isMine ? SlideInRight.duration(300) : SlideInLeft.duration(300)} 
                layout={Layout.springify().damping(15)}
                style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow, nextIsSame && { marginBottom: 4 }]}
            >
                {!isMine && (
                    <View style={styles.senderAvatarSpace}>
                        {!nextIsSame ? (
                            item.sender.avatarUrl ? (
                                <Image source={{ uri: getImageUrl(item.sender.avatarUrl) || '' }} style={styles.miniAvatar} />
                            ) : (
                                <View style={styles.miniAvatarPlaceholder}><User size={12} color="#94A3B8" /></View>
                            )
                        ) : null}
                    </View>
                )}
                
                <Pressable 
                    onPress={() => item.type === 'IMAGE' && setLightboxImage(item.fileUrl || null)}
                    style={[
                        styles.bubble, 
                        isMine ? styles.myBubble : styles.theirBubble,
                        item.type === 'IMAGE' && styles.imageBubble,
                        item.type === 'DOCUMENT' && styles.docBubble
                    ]}
                >
                    {item.type === 'IMAGE' && item.fileUrl && (
                        <Image 
                            source={{ uri: getImageUrl(item.fileUrl) || '' }} 
                            style={styles.messageImage}
                            contentFit="cover"
                        />
                    )}

                    {item.type === 'DOCUMENT' && (
                        <View style={styles.docRow}>
                            <View style={styles.docIconBox}>
                                <FileText size={20} color={isMine ? '#FFF' : Colors.primary} />
                            </View>
                            <View style={styles.docInfo}>
                                <Text style={[styles.docName, isMine && { color: '#FFF' }]} numberOfLines={1}>
                                    {item.fileName || 'Document'}
                                </Text>
                                <Text style={[styles.docSize, isMine && { color: 'rgba(255,255,255,0.6)' }]}>
                                    Tap to view file
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Show content only if it's not a dummy image/doc placeholder or if there's actual text */}
                    {(item.type === 'TEXT' || (item.content !== 'Sent an image' && item.content !== 'Sent a document')) && (
                        <Text style={[styles.messageText, isMine && { color: '#FFF' }, item.type !== 'TEXT' && { marginTop: 8 }]}>
                            {item.content}
                        </Text>
                    )}

                    <View style={styles.metaRow}>
                        <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.7)' }]}>
                            {format(new Date(item.createdAt), 'HH:mm')}
                        </Text>
                        {isMine && <CheckCheck size={12} color={item.type === 'IMAGE' ? Colors.primary : "rgba(255,255,255,0.8)"} strokeWidth={2.5} />}
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />
            <Stack.Screen options={{ headerShown: false }} />

            {/* CLEAN PRO HEADER */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#111" strokeWidth={2.5} />
                    </Pressable>
                    
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.headerAvatarBox}>
                            {merchantInfo?.avatarUrl ? (
                                <Image source={{ uri: getImageUrl(merchantInfo.avatarUrl) || '' }} style={styles.headerAvatar} />
                            ) : (
                                <View style={styles.headerAvatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>{merchantInfo?.name?.[0] || 'S'}</Text>
                                </View>
                            )}
                            <View style={[styles.headerStatusDot, { backgroundColor: Colors.success }]} />
                        </View>
                        <View style={styles.headerInfoText}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {merchantInfo?.name || 'Support Expert'}
                            </Text>
                            <Text style={styles.headerSub}>
                                {othersTyping ? 'typing...' : 'active now'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <Pressable style={styles.headerActionBtn}>
                            <Phone size={20} color="#111" strokeWidth={2} />
                        </Pressable>
                        <Pressable style={styles.headerActionBtn}>
                            <MoreHorizontal size={20} color="#111" strokeWidth={2} />
                        </Pressable>
                    </View>
                </View>
                <View style={styles.headerBorder} />
            </View>

            {/* MESSAGE LIST */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.messageList, 
                        { paddingTop: insets.top + 80, paddingBottom: 100 }
                    ]}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* ATTACHMENT PREVIEW ZONE */}
            {pendingAttachment && (
                <Animated.View entering={FadeInDown} exiting={FadeInUp} style={styles.previewZone}>
                    <View style={styles.previewPill}>
                        {pendingAttachment.type === 'IMAGE' ? (
                            <RNImage source={{ uri: pendingAttachment.uri }} style={styles.previewThumb} />
                        ) : (
                            <View style={styles.previewIconBox}><FileText size={20} color={Colors.primary} /></View>
                        )}
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewName} numberOfLines={1}>{pendingAttachment.name}</Text>
                            <Text style={styles.previewStatus}>Ready to transmit</Text>
                        </View>
                        <Pressable style={styles.previewClose} onPress={() => setPendingAttachment(null)}>
                            <X size={16} color="#64748B" />
                        </Pressable>
                    </View>
                </Animated.View>
            )}

            {/* PINNED WHITE FOOTER INPUT */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
                style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 10) }]}
            >
                <View style={styles.inputBorder} />
                <View style={styles.inputContent}>
                    <Pressable style={styles.plusBtn} onPress={() => setShowAttachmentMenu(true)}>
                        <Plus size={22} color="#64748B" strokeWidth={2.5} />
                    </Pressable>
                    
                    <TextInput
                        style={styles.textInput}
                        value={input}
                        onChangeText={handleTextChange}
                        placeholder={pendingAttachment ? "Add a caption..." : "Message..."}
                        placeholderTextColor="#94A3B8"
                        multiline
                    />

                    <Pressable 
                        style={[styles.sendBtn, (!input.trim() && !pendingAttachment) && styles.sendBtnDisabled]} 
                        onPress={handleSend}
                        disabled={(!input.trim() && !pendingAttachment) || sending}
                    >
                        <LinearGradient 
                            colors={[Colors.primary, '#FF7A00']} 
                            style={styles.sendGradient}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Send size={18} color="#FFF" strokeWidth={3} />
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            {/* ATTACHMENT MENU MODAL */}
            <Modal
                visible={showAttachmentMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAttachmentMenu(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentMenu(false)}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.menuContent}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Transmission Content</Text>
                            <Pressable onPress={() => setShowAttachmentMenu(false)}><X size={20} color="#94A3B8" /></Pressable>
                        </View>
                        
                        <View style={styles.menuGrid}>
                            <Pressable style={styles.menuItem} onPress={handlePickImage}>
                                <View style={[styles.menuIconCircle, { backgroundColor: '#E0F2FE' }]}>
                                    <ImageIcon size={24} color="#0EA5E9" />
                                </View>
                                <Text style={styles.menuLabel}>Photos</Text>
                            </Pressable>
                            
                            <Pressable style={styles.menuItem} onPress={handlePickDocument}>
                                <View style={[styles.menuIconCircle, { backgroundColor: '#F0FDF4' }]}>
                                    <FileText size={24} color="#22C55E" />
                                </View>
                                <Text style={styles.menuLabel}>Docs</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => { setShowAttachmentMenu(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                                <View style={[styles.menuIconCircle, { backgroundColor: '#FFF7ED' }]}>
                                    <Paperclip size={24} color="#F97316" />
                                </View>
                                <Text style={styles.menuLabel}>Links</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* IMAGE LIGHTBOX */}
            <Modal
                visible={!!lightboxImage}
                transparent
                animationType="fade"
                onRequestClose={() => setLightboxImage(null)}
            >
                <View style={styles.lightboxContainer}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    
                    <View style={styles.lightboxHeader}>
                        <Pressable onPress={() => setLightboxImage(null)} style={styles.lbClose}>
                            <X size={24} color="#FFF" />
                        </Pressable>
                        <View style={styles.lbActions}>
                            <Pressable style={styles.lbActionBtn}><Download size={20} color="#FFF" /></Pressable>
                        </View>
                    </View>

                    <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.lbContent}>
                        {lightboxImage && (
                            <Image 
                                source={{ uri: getImageUrl(lightboxImage) || '' }} 
                                style={styles.lbImage}
                                contentFit="contain"
                            />
                        )}
                    </Animated.View>

                    <View style={styles.lightboxFooter}>
                        <Text style={styles.lbMeta}>Secured Transmission View</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.95)' },
    headerContent: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
    headerBackBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatarBox: { position: 'relative' },
    headerAvatar: { width: 36, height: 36, borderRadius: 12 },
    headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    headerStatusDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
    headerInfoText: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
    headerSub: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: -1 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerActionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerBorder: { height: 1, backgroundColor: '#F1F5F9' },

    // Message List
    messageList: { paddingHorizontal: 16 },
    messageRow: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    myRow: { justifyContent: 'flex-end' },
    theirRow: { justifyContent: 'flex-start' },
    
    senderAvatarSpace: { width: 28, alignItems: 'center' },
    miniAvatar: { width: 28, height: 28, borderRadius: 10 },
    miniAvatarPlaceholder: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

    bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    myBubble: { backgroundColor: '#0F172A', borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
    
    // Media Bubbles
    imageBubble: { padding: 4, borderRadius: 16, overflow: 'hidden' },
    messageImage: { width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.45, borderRadius: 12 },
    docBubble: { minWidth: 200, padding: 12 },
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    docIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
    docInfo: { flex: 1 },
    docName: { fontSize: 13, fontWeight: '700', color: '#111' },
    docSize: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 2 },

    messageText: { fontSize: 15, fontWeight: '500', color: '#111', lineHeight: 22 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
    timeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

    // Preview Zone
    previewZone: { position: 'absolute', bottom: 70, left: 16, right: 16, zIndex: 10 },
    previewPill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    previewThumb: { width: 44, height: 44, borderRadius: 12 },
    previewIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    previewInfo: { flex: 1 },
    previewName: { fontSize: 12, fontWeight: '700', color: '#111' },
    previewStatus: { fontSize: 9, fontWeight: '600', color: Colors.primary },
    previewClose: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

    // Pinned Input Footer
    inputArea: { backgroundColor: '#FFF' },
    inputBorder: { height: 1, backgroundColor: '#F1F5F9' },
    inputContent: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
    plusBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    textInput: { flex: 1, minHeight: 40, maxHeight: 120, fontSize: 15, fontWeight: '500', color: '#111', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 20 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    sendBtnDisabled: { opacity: 0.5 },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal Style
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    menuContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: 40 },
    menuHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
    menuTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
    menuGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    menuItem: { alignItems: 'center', gap: 10 },
    menuIconCircle: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: 13, fontWeight: '800', color: '#64748B' },

    // Lightbox
    lightboxContainer: { flex: 1, backgroundColor: '#000' },
    lightboxHeader: { position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    lbClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    lbActions: { flexDirection: 'row', gap: 12 },
    lbActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    lbContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lbImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
    lightboxFooter: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    lbMeta: { color: '#FFF', fontSize: 12, fontWeight: '700', opacity: 0.6, letterSpacing: 1 },
});
