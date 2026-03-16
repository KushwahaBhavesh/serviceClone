import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { Agent } from '../../lib/merchant';

const STATUS_COLOR: Record<string, string> = {
    AVAILABLE: Colors.success,
    BUSY: Colors.warning,
    OFFLINE: Colors.textMuted,
};

const SKILLS_OPTIONS = ['Plumbing', 'Electrician', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'];

export default function AgentManagementScreen() {
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
        } catch {
            Alert.alert('Error', 'Failed to load agents');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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
            await merchantApi.createAgent({ name: form.name, phone: form.phone, email: form.email || undefined, skills: form.skills });
            setShowAddModal(false);
            setForm({ name: '', phone: '', email: '', skills: [] });
            fetchAgents();
        } catch {
            Alert.alert('Error', 'Failed to create agent');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (agent: Agent) => {
        try {
            await merchantApi.updateAgent(agent.id, { isActive: !agent.isActive });
            fetchAgents();
        } catch { Alert.alert('Error', 'Failed to update agent'); }
    };

    const renderAgent = ({ item }: { item: Agent }) => (
        <View style={styles.agentCard}>
            <View style={styles.agentAvatar}>
                <Text style={styles.agentInitial}>{(item.user?.name ?? 'A')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{item.user?.name ?? 'Agent'}</Text>
                <Text style={styles.agentPhone}>{item.user?.phone ?? ''}</Text>
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
            <View style={styles.agentRight}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                <Text style={[styles.statusLabel, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.toggleBtn, item.isActive ? styles.activeBadge : styles.inactiveBadge]}
                    onPress={() => handleToggle(item)}
                >
                    <Text style={[styles.toggleText, { color: item.isActive ? Colors.success : Colors.textMuted }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Field Agents</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="person-add" size={18} color={Colors.textOnPrimary} />
                    <Text style={styles.addBtnText}>Add Agent</Text>
                </TouchableOpacity>
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
                            <Ionicons name="people" size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No agents yet</Text>
                            <Text style={styles.emptySubText}>Add field agents to assign them to jobs</Text>
                        </View>
                    }
                />
            )}

            {/* Add Agent Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Agent</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalBody}>
                        <Text style={styles.fieldLabel}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                            placeholder="Enter agent name"
                            placeholderTextColor={Colors.textMuted}
                        />
                        <Text style={styles.fieldLabel}>Phone *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.phone}
                            onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                            placeholder="+91 9876543210"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="phone-pad"
                        />
                        <Text style={styles.fieldLabel}>Email (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
                            placeholder="agent@email.com"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Text style={styles.fieldLabel}>Skills</Text>
                        <View style={styles.skillsGrid}>
                            {SKILLS_OPTIONS.map((skill) => {
                                const selected = form.skills.includes(skill);
                                return (
                                    <TouchableOpacity
                                        key={skill}
                                        style={[styles.skillOption, selected && styles.skillOptionSelected]}
                                        onPress={() => toggleSkill(skill)}
                                    >
                                        <Text style={[styles.skillOptionText, selected && { color: Colors.primary }]}>{skill}</Text>
                                        {selected && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleAdd}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={styles.saveBtnText}>Add Agent</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
    addBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textOnPrimary },
    list: { padding: Spacing.md, gap: Spacing.sm },
    agentCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.md, alignItems: 'flex-start' },
    agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    agentInitial: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
    agentInfo: { flex: 1 },
    agentName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    agentPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    skillChip: { backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
    skillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
    agentRight: { alignItems: 'center', gap: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: FontSize.xs, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text },
    toggleBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm, marginTop: 2 },
    activeBadge: { backgroundColor: Colors.success + '20' },
    inactiveBadge: { backgroundColor: Colors.textMuted + '20' },
    toggleText: { fontSize: FontSize.xs, fontWeight: '700' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textMuted },
    emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
    modal: { flex: 1, backgroundColor: Colors.backgroundAlt },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    modalBody: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
    fieldLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    skillOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
    skillOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
    skillOptionText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
    saveBtnText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textOnPrimary },
});
