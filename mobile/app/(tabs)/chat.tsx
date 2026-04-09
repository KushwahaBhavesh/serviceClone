import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import {
    MessageSquare,
    Search,
    User,
    ShieldCheck,
    ChevronRight,
    Zap,
    Sparkles,
    Filter,
    BellDot,
    Navigation2
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { Colors, Spacing } from '../../constants/theme';
import { customerApi, type Chat } from '../../lib/marketplace';
import { getImageUrl } from '../../lib/api';
import EmptyState from '../../components/shared/EmptyState';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchChats = async () => {
        try {
            const response = await customerApi.listChats();
            setChats(response.data.chats);
        } catch { /* silent */ }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const filteredChats = chats.filter(chat => {
        const participant = chat.booking.agent?.user || chat.booking.merchant;
        return participant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderChatItem = ({ item, index }: { item: Chat; index: number }) => {
        const lastMessage = item.messages[0];
        const participant = item.booking.agent?.user || item.booking.merchant;
        const participantName = participant?.name || 'FIELD EXPERT';
        const participantAvatar = participant?.avatarUrl;

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <Pressable
                    style={styles.chatCard}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/(customer)/chat/${item.id}`);
                    }}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatar}>
                                {participantAvatar ? (
                                    <Image source={{ uri: getImageUrl(participantAvatar) || '' }} style={styles.avatarImg} />
                                ) : (
                                    <User size={24} color="#94A3B8" />
                                )}
                            </View>
                            {item.isActive && <View style={styles.activePulse} />}
                        </View>

                        <View style={styles.chatContent}>
                            <View style={styles.nameRow}>
                                <Text style={styles.nameText} numberOfLines={1}>{participantName.toUpperCase()}</Text>
                                <Text style={styles.timeText}>
                                    {lastMessage ? format(new Date(lastMessage.createdAt), 'HH:mm') : ''}
                                </Text>
                            </View>

                            <Text style={styles.msgPreview} numberOfLines={1}>
                                {lastMessage?.content || 'Waiting for messages...'}
                            </Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.bookingBadge}>
                                    <Text style={styles.bookingText}>LOG #{item.booking.bookingNumber}</Text>
                                </View>
                                <View style={styles.expertTag}>
                                    <ShieldCheck size={10} color={Colors.primary} strokeWidth={3} />
                                    <Text style={styles.expertTagText}>VERIFIED</Text>
                                </View>
                            </View>
                        </View>
                        <ChevronRight size={18} color="#E2E8F0" strokeWidth={3} />
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Sticky Glass Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>MESSAGES</Text>
                        <Text style={styles.headerSub}>ACTIVE CHATS</Text>
                    </View>
                    <Pressable style={styles.filterBtn}>
                        <Filter size={18} color="#0F172A" strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#94A3B8" strokeWidth={2.5} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="SEARCH MESSAGES..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')}>
                                <Zap size={14} color={Colors.primary} fill={Colors.primary} />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 140 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? <EmptyState
                        icon="chatbubble-ellipses-outline"
                        title="No conversations yet"
                        subtitle="Start a conversation with a merchant or agent"
                    /> : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, marginBottom: 15 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
    headerSub: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
    filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

    searchContainer: { paddingHorizontal: 20, paddingBottom: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 15, height: 48, gap: 10, borderWidth: 1.5, borderColor: '#F1F5F9' },
    searchInput: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0F172A', letterSpacing: 0.5 },

    listContent: { paddingHorizontal: 20, paddingBottom: 120 },

    chatCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 18, marginBottom: 12, borderWidth: 1.5, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    activePulse: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.success, borderWidth: 3, borderColor: '#FFF' },

    chatContent: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    nameText: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 },
    timeText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
    msgPreview: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 10 },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bookingBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    bookingText: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
    expertTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    expertTagText: { fontSize: 8, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 60, paddingTop: 100 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 40, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: 2 },
    emptySubtitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 20 },
});
