import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, Pressable,
    ActivityIndicator, ScrollView, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Save, UserPlus, Wrench } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi, Agent } from '../../lib/merchant';
import { useToast } from '../../context/ToastContext';

const SKILLS_OPTIONS = ['Plumbing', 'Electrician', 'Cleaning', 'Carpentry', 'Painting', 'AC Repair'];

export default function AddEditAgentScreen() {
    const { agentId } = useLocalSearchParams<{ agentId?: string }>();
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();
    const isEdit = !!agentId;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [skills, setSkills] = useState<string[]>([]);

    // Fetch existing agent data in edit mode
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await merchantApi.listAgents();
                const found = res.data.agents.find((a: Agent) => a.id === agentId);
                if (found) {
                    setName(found.user?.name ?? '');
                    setPhone(found.user?.phone ?? '');
                    setEmail(found.user?.email ?? '');
                    setSkills(found.skills ?? []);
                }
            } catch { showError('Failed to load agent'); }
            finally { setLoading(false); }
        })();
    }, [agentId, isEdit]);

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill],
        );
    };

    const handleSave = async () => {
        if (!name.trim()) { showInfo('Name is required'); return; }
        if (!phone.trim()) { showInfo('Phone number is required'); return; }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            if (isEdit) {
                await merchantApi.updateAgent(agentId!, { skills });
                showSuccess('Agent updated');
            } else {
                await merchantApi.createAgent({
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim() || undefined,
                    skills,
                });
                showSuccess('Agent created');
            }
            router.back();
        } catch {
            showError(isEdit ? 'Failed to update agent' : 'Failed to create agent');
        } finally { setSaving(false); }
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
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Agent' : 'Add Agent'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Personal Info */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>

                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter agent's full name"
                                placeholderTextColor="#CBD5E1"
                                editable={!isEdit}
                            />

                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+91 9876543210"
                                placeholderTextColor="#CBD5E1"
                                keyboardType="phone-pad"
                                editable={!isEdit}
                            />

                            <Text style={styles.label}>Email (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="agent@example.com"
                                placeholderTextColor="#CBD5E1"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isEdit}
                            />
                        </View>
                    </Animated.View>

                    {/* Skills */}
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <View style={styles.section}>
                            <View style={styles.skillsHeader}>
                                <Wrench size={16} color={Colors.primary} strokeWidth={2} />
                                <Text style={styles.sectionTitle}>Skills</Text>
                            </View>
                            <Text style={styles.skillsHint}>Select the services this agent can perform</Text>
                            <View style={styles.skillsGrid}>
                                {SKILLS_OPTIONS.map((skill) => {
                                    const selected = skills.includes(skill);
                                    return (
                                        <Pressable
                                            key={skill}
                                            onPress={() => { toggleSkill(skill); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                            style={[styles.skillChip, selected && styles.skillChipSelected]}
                                        >
                                            <Text style={[styles.skillText, selected && styles.skillTextSelected]}>
                                                {skill}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                    {isEdit && (
                        <Animated.View entering={FadeInDown.delay(250).springify()}>
                            <View style={styles.editNote}>
                                <Text style={styles.editNoteText}>
                                    Name, phone, and email cannot be changed after creation. Only skills can be updated.
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Save Button */}
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <Pressable
                            onPress={handleSave}
                            disabled={saving}
                            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF8533']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        {isEdit ? (
                                            <Save size={18} color="#FFF" strokeWidth={2.5} />
                                        ) : (
                                            <UserPlus size={18} color="#FFF" strokeWidth={2.5} />
                                        )}
                                        <Text style={styles.saveBtnText}>
                                            {isEdit ? 'Save Changes' : 'Create Agent'}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </ScrollView>
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

    content: { padding: Spacing.lg, paddingBottom: 100, gap: 16 },

    section: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

    label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 14, color: '#0F172A', fontWeight: '500',
        borderWidth: 1, borderColor: '#F1F5F9',
    },

    skillsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    skillsHint: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginBottom: 12 },
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    },
    skillChipSelected: {
        backgroundColor: Colors.primary + '14', borderColor: Colors.primary,
    },
    skillText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    skillTextSelected: { color: Colors.primary, fontWeight: '700' },

    editNote: {
        backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#FDE68A',
    },
    editNoteText: { fontSize: 12, fontWeight: '600', color: '#92400E', lineHeight: 18 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 16, gap: 8,
    },
    saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
