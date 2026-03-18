import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    CheckCircle, Circle, PlusCircle, Plus,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi } from '../../lib/merchant';
import type { Slot, Agent } from '../../lib/merchant';

const TIME_SLOTS = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' },
];

function getDayRange(offset: number) { const d = new Date(); d.setDate(d.getDate() + offset); return d; }
function formatDate(d: Date) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

export default function ScheduleScreen() {
    const insets = useSafeAreaInsets();
    const [dayOffset, setDayOffset] = useState(0);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const selectedDate = getDayRange(dayOffset);
    const dateStr = toISODate(selectedDate);

    const fetchData = useCallback(async () => {
        setLoading(true); setSelectedSlots([]);
        try {
            const [slotsRes, agentsRes] = await Promise.all([
                merchantApi.listSlots(dateStr), merchantApi.listAgents(),
            ]);
            setSlots(slotsRes.data.slots);
            setAgents(agentsRes.data.agents);
        } catch { Alert.alert('Error', 'Failed to load schedule'); }
        finally { setLoading(false); }
    }, [dateStr]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleSlotSelection = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedSlots((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
    };

    const handleCreateSlots = async () => {
        if (selectedSlots.length === 0) { Alert.alert('Select Slots', 'Please select at least one time slot'); return; }
        setCreating(true);
        try {
            const slotsPayload = selectedSlots.map((key) => {
                const [start, end] = key.split('-');
                return { startTime: start, endTime: end };
            });
            const res = await merchantApi.createSlots({ date: dateStr, slots: slotsPayload });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `${res.data.created} slot(s) created`);
            fetchData();
        } catch { Alert.alert('Error', 'Failed to create slots'); }
        finally { setCreating(false); }
    };

    const isSlotBooked = (start: string, end: string) => slots.some(s => s.startTime === start && s.endTime === end && s.isBooked);
    const isSlotExisting = (start: string, end: string) => slots.some(s => s.startTime === start && s.endTime === end);
    const days = Array.from({ length: 7 }, (_, i) => i);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <Text style={styles.screenTitle}>Schedule</Text>

            {/* Day Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPicker}>
                {days.map((offset) => {
                    const d = getDayRange(offset);
                    const isActive = offset === dayOffset;
                    return (
                        <Pressable key={offset} onPress={() => setDayOffset(offset)}
                            style={[styles.dayBtn, isActive && styles.dayBtnActive]}>
                            <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                                {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dayNum, isActive && styles.dayNumActive]}>
                                {d.getDate()}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slotsContainer}>
                    {TIME_SLOTS.map(({ start, end }, index) => {
                        const key = `${start}-${end}`;
                        const existing = isSlotExisting(start, end);
                        const booked = isSlotBooked(start, end);
                        const selected = selectedSlots.includes(key);
                        const slot = slots.find(s => s.startTime === start && s.endTime === end);

                        return (
                            <Animated.View key={key} entering={FadeInDown.delay(index * 60).springify()}>
                                <Pressable
                                    style={[
                                        styles.slotRow,
                                        existing && styles.slotExisting,
                                        booked && styles.slotBooked,
                                        selected && styles.slotSelected,
                                    ]}
                                    onPress={() => !existing && !booked && toggleSlotSelection(key)}
                                    disabled={existing || booked}
                                >
                                    <View style={styles.slotTime}>
                                        <Text style={styles.slotTimeText}>{start}</Text>
                                        <Text style={styles.slotSep}>—</Text>
                                        <Text style={styles.slotTimeText}>{end}</Text>
                                    </View>
                                    <View style={styles.slotMeta}>
                                        {booked ? (
                                            <>
                                                <CheckCircle size={16} color="#10B981" strokeWidth={2} />
                                                <Text style={[styles.slotStatus, { color: '#10B981' }]}>Booked</Text>
                                                {slot?.agent && <Text style={styles.slotAgent}>{slot.agent.user?.name}</Text>}
                                            </>
                                        ) : existing ? (
                                            <>
                                                <Circle size={16} color="#6366F1" strokeWidth={2} />
                                                <Text style={[styles.slotStatus, { color: '#6366F1' }]}>Open</Text>
                                            </>
                                        ) : selected ? (
                                            <>
                                                <PlusCircle size={16} color={Colors.primary} fill={Colors.primary + '20'} strokeWidth={2} />
                                                <Text style={[styles.slotStatus, { color: Colors.primary }]}>Selected</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} color="#CBD5E1" strokeWidth={2} />
                                                <Text style={[styles.slotStatus, { color: '#94A3B8' }]}>Add Slot</Text>
                                            </>
                                        )}
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}

                    {/* Summary */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryDot, { backgroundColor: '#6366F1' }]} />
                            <Text style={styles.summaryText}>Open slots: {slots.filter(s => !s.isBooked).length}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.summaryText}>Booked: {slots.filter(s => s.isBooked).length}</Text>
                        </View>
                    </View>

                    {selectedSlots.length > 0 && (
                        <Pressable
                            onPress={handleCreateSlots} disabled={creating}
                            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }, creating && { opacity: 0.5 }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.createGradient}
                            >
                                {creating ? <ActivityIndicator color="#FFF" /> : (
                                    <Text style={styles.createBtnText}>
                                        Create {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

    dayPicker: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 8 },
    dayBtn: {
        width: 54, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF', gap: 2, borderWidth: 1, borderColor: '#F1F5F9',
    },
    dayBtnActive: {
        backgroundColor: Colors.primary, borderColor: Colors.primary,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    dayLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
    dayLabelActive: { color: 'rgba(255,255,255,0.7)' },
    dayNum: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    dayNumActive: { color: '#FFF' },
    dateLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },

    slotsContainer: { padding: Spacing.lg, gap: 8, paddingBottom: 40 },
    slotRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', borderRadius: 16, padding: 16,
        borderWidth: 1.5, borderColor: '#F1F5F9',
    },
    slotExisting: { borderColor: '#6366F1' + '30', backgroundColor: '#6366F1' + '06' },
    slotBooked: { borderColor: '#10B981' + '30', backgroundColor: '#10B981' + '06' },
    slotSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
    slotTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    slotTimeText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    slotSep: { fontSize: 11, color: '#CBD5E1' },
    slotMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    slotStatus: { fontSize: 13, fontWeight: '700' },
    slotAgent: { fontSize: 11, color: '#64748B', fontWeight: '500' },

    summaryCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    summaryDot: { width: 10, height: 10, borderRadius: 5 },
    summaryText: { fontSize: 13, color: '#64748B', fontWeight: '600' },

    createBtn: { borderRadius: 16, overflow: 'hidden' },
    createGradient: { paddingVertical: 16, alignItems: 'center' },
    createBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
