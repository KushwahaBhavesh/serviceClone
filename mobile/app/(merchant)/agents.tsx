import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
    RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, UserPlus, Star, Users, Phone,
    Mail, Wrench,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import { useToast } from '../../context/ToastContext';
import type { Agent } from '../../lib/merchant';
import EmptyState from '../../components/shared/EmptyState';

const STATUS_COLOR: Record<string, string> = {
    AVAILABLE: Colors.primary,
    BUSY: Colors.secondary,
    OFFLINE: '#94A3B8',
};

const SKILLS_OPTIONS = ['Plumbing', 'Electrician', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'];

export default function AgentManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await merchantApi.listAgents();
            setAgents(res.data.agents);
        } catch { showError('Failed to load agents'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAgents();
        }, [fetchAgents])
    );





    const handleToggle = async (agent: Agent) => {
        try {
            await merchantApi.updateAgent(agent.id, { isActive: !agent.isActive });
            fetchAgents();
            showSuccess(`Agent ${!agent.isActive ? 'activated' : 'deactivated'}`);
        } catch { showError('Failed to update agent'); }
    };

    const renderAgent = useCallback(({ item, index }: { item: Agent; index: number }) => {
        const statusColor = STATUS_COLOR[item.status] || '#94A3B8';
        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
                <Pressable
                    onPress={() => router.push({ pathname: '/(merchant)/add-edit-agent', params: { agentId: item.id } } as any)}
                    style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                >
                    <View style={styles.agentCard}>
                        <View style={styles.agentRow}>
                            <View style={styles.avatarWrap}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(item.user?.name ?? 'A')[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            </View>

                            <View style={styles.agentInfo}>
                                <Text style={styles.agentName}>{item.user?.name ?? 'Agent'}</Text>
                                <Text style={styles.agentPhone}>{item.user?.phone ?? ''}</Text>
                            </View>

                            <View style={styles.agentMeta}>
                                <View style={styles.ratingPill}>
                                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                </View>
                                <Pressable
                                    onPress={() => handleToggle(item)}
                                    style={[styles.toggleBtn, { backgroundColor: item.isActive ? Colors.success + '14' : '#F1F5F9' }]}
                                >
                                    <Text style={[styles.toggleText, { color: item.isActive ? Colors.primary : '#94A3B8' }]}>
                                        {item.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {item.skills.length > 0 && (
                            <View style={styles.skills}>
                                {item.skills.map((s) => (
                                    <View key={s} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{s}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, [handleToggle, router]);

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
                <Text style={styles.title}>Field Agents</Text>
                <Pressable
                    onPress={() => { router.push('/(merchant)/add-edit-agent' as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.addGradient}
                    >
                        <UserPlus size={16} color="#FFF" strokeWidth={2.5} />
                        <Text style={styles.addText}>Add</Text>
                    </LinearGradient>
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <FlatList
                    data={agents}
                    renderItem={renderAgent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAgents(); }} colors={[Colors.primary]} />}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={8}
                    ListEmptyComponent={
                        <EmptyState
                            icon="people-outline"
                            title="No agents added yet"
                            subtitle="Add your first agent to start assigning jobs"
                            ctaLabel="Add Agent"
                            onCta={() => router.push('/(merchant)/add-edit-agent' as any)}
                        />
                    }
                />
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 14, gap: 12,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },
    title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0F172A' },
    addBtn: { borderRadius: 14, overflow: 'hidden' },
    addGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    addText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    list: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },

    agentCard: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    agentRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 48, height: 48, borderRadius: 16,
        backgroundColor: Colors.primary + '14',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    statusDot: {
        width: 13, height: 13, borderRadius: 7,
        position: 'absolute', bottom: -2, right: -2,
        borderWidth: 2.5, borderColor: '#FFF',
    },
    agentInfo: { flex: 1 },
    agentName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    agentPhone: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },

    agentMeta: { alignItems: 'flex-end', gap: 6 },
    ratingPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    ratingText: { fontSize: 11, fontWeight: '800', color: '#D97706' },
    toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    toggleText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    skillChip: {
        backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    skillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

    empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyIconBox: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    emptyHint: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },

});
