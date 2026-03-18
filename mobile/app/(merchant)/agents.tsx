import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
    RefreshControl, ActivityIndicator, Alert,
    Modal, TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, UserPlus, Star, Users, Phone,
    Mail, Check, X, Wrench,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { Agent } from '../../lib/merchant';

const STATUS_COLOR: Record<string, string> = {
    AVAILABLE: Colors.success,
    BUSY: '#F59E0B',
    OFFLINE: '#94A3B8',
};

const SKILLS_OPTIONS = ['Plumbing', 'Electrician', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'];

export default function AgentManagementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', skills: [] as string[] });

    const fetchAgents = useCallback(async () => {
        try {
            const res = await merchantApi.listAgents();
            setAgents(res.data.agents);
        } catch { Alert.alert('Error', 'Failed to load agents'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchAgents(); }, [fetchAgents]);

    const toggleSkill = (skill: string) => {
        setForm((f) => ({
            ...f,
            skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
        }));
    };

    const handleAdd = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            Alert.alert('Validation', 'Name and phone are required');
            return;
        }
        setSaving(true);
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await merchantApi.createAgent({ name: form.name, phone: form.phone, email: form.email || undefined, skills: form.skills });
            setShowAddModal(false);
            setForm({ name: '', phone: '', email: '', skills: [] });
            fetchAgents();
        } catch { Alert.alert('Error', 'Failed to create agent'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (agent: Agent) => {
        try {
            await merchantApi.updateAgent(agent.id, { isActive: !agent.isActive });
            fetchAgents();
        } catch { Alert.alert('Error', 'Failed to update agent'); }
    };

    const renderAgent = ({ item, index }: { item: Agent; index: number }) => {
        const statusColor = STATUS_COLOR[item.status] || '#94A3B8';
        return (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
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
                                <Text style={[styles.toggleText, { color: item.isActive ? Colors.success : '#94A3B8' }]}>
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
            </Animated.View>
        );
    };

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
                    onPress={() => { setShowAddModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
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
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <Users size={32} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No agents yet</Text>
                            <Text style={styles.emptyHint}>Add field agents to assign them to jobs</Text>
                        </View>
                    }
                />
            )}

            {/* Add Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Agent</Text>
                        <Pressable onPress={() => setShowAddModal(false)} style={styles.modalClose}>
                            <X size={20} color="#64748B" strokeWidth={2} />
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.fieldLabel}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                            placeholder="Enter agent name"
                            placeholderTextColor="#CBD5E1"
                        />

                        <Text style={styles.fieldLabel}>Phone *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.phone}
                            onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                            placeholder="+91 9876543210"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.fieldLabel}>Email (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
                            placeholder="agent@email.com"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.fieldLabel}>Skills</Text>
                        <View style={styles.skillsGrid}>
                            {SKILLS_OPTIONS.map((skill) => {
                                const selected = form.skills.includes(skill);
                                return (
                                    <Pressable
                                        key={skill}
                                        onPress={() => toggleSkill(skill)}
                                        style={[styles.skillOption, selected && styles.skillOptionSelected]}
                                    >
                                        {selected && <Check size={14} color={Colors.primary} strokeWidth={2.5} />}
                                        <Text style={[styles.skillOptionText, selected && { color: Colors.primary }]}>
                                            {skill}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable
                            onPress={handleAdd} disabled={saving}
                            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saving && { opacity: 0.5 }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.saveGradient}
                            >
                                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Add Agent</Text>}
                            </LinearGradient>
                        </Pressable>
                    </ScrollView>
                </View>
            </Modal>
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

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    modalClose: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    modalBody: { padding: Spacing.xl, gap: 8, paddingBottom: 40 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 8 },
    input: {
        backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: '#0F172A', fontWeight: '600',
        borderWidth: 1, borderColor: '#F1F5F9',
    },

    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    skillOption: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF',
    },
    skillOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
    skillOptionText: { fontSize: 13, fontWeight: '700', color: '#334155' },

    saveBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    saveGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    saveText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
