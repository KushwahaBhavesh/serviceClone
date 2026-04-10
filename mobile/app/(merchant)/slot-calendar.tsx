import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ActivityIndicator, ScrollView, RefreshControl, Alert,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
    ChevronLeft, ChevronRight, Plus, Clock,
    Calendar as CalendarIcon, User as UserIcon, Trash2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { merchantApi, Slot, Agent } from '../../lib/merchant';
import { useToast } from '../../context/ToastContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '8 AM – 10 AM' },
    { start: '10:00', end: '12:00', label: '10 AM – 12 PM' },
    { start: '12:00', end: '14:00', label: '12 PM – 2 PM' },
    { start: '14:00', end: '16:00', label: '2 PM – 4 PM' },
    { start: '16:00', end: '18:00', label: '4 PM – 6 PM' },
    { start: '18:00', end: '20:00', label: '6 PM – 8 PM' },
];

function toISODate(d: Date) {
    return d.toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getMonthLabel(year: number, month: number) {
    return new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function SlotCalendarScreen() {
    const insets = useSafeAreaInsets();
    const { showSuccess, showError, showInfo } = useToast();

    const today = useMemo(() => new Date(), []);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [slotsRes, agentsRes] = await Promise.all([
                merchantApi.listSlots(selectedDate || undefined),
                merchantApi.listAgents(),
            ]);
            setSlots(slotsRes.data.slots);
            setAgents(agentsRes.data.agents);
        } catch { showError('Failed to load data'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [selectedDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDow = new Date(year, month, 1).getDay();
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDow; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [year, month]);

    // Slot counts by date
    const slotCountByDate = useMemo(() => {
        const map: Record<string, { total: number; booked: number }> = {};
        slots.forEach((s) => {
            const d = s.date.split('T')[0];
            if (!map[d]) map[d] = { total: 0, booked: 0 };
            map[d].total++;
            if (s.isBooked) map[d].booked++;
        });
        return map;
    }, [slots]);

    const slotsForDate = useMemo(() => {
        if (!selectedDate) return [];
        return slots.filter((s) => s.date.split('T')[0] === selectedDate);
    }, [slots, selectedDate]);

    const navigateMonth = (dir: number) => {
        let m = month + dir;
        let y = year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setMonth(m); setYear(y);
        setSelectedDate(null);
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const toggleTimeSlot = (key: string) => {
        setSelectedTimeSlots(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
        );
    };

    const handleCreateSlots = async () => {
        if (!selectedDate) return;
        if (selectedTimeSlots.length === 0) { showInfo('Select at least one time slot'); return; }
        setCreating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const bulkSlots = selectedTimeSlots.map((key) => {
                const ts = TIME_SLOTS.find(t => `${t.start}-${t.end}` === key)!;
                return {
                    startTime: ts.start,
                    endTime: ts.end,
                    agentId: selectedAgent || undefined,
                };
            });
            await merchantApi.createSlots({ date: selectedDate, slots: bulkSlots });
            showSuccess(`${bulkSlots.length} slot(s) created`);
            setShowAddModal(false);
            setSelectedTimeSlots([]);
            setSelectedAgent(null);
            fetchData();
        } catch { showError('Failed to create slots'); }
        finally { setCreating(false); }
    };

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return selectedDate === dateStr;
    };

    const isPast = (day: number) => {
        const d = new Date(year, month, day);
        const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return d < t;
    };

    if (loading) {
        return <View style={[styles.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Slot Calendar</Text>
                <Pressable
                    onPress={() => { if (selectedDate) { setShowAddModal(true); } else { showInfo('Select a date first'); } }}
                    style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                    <LinearGradient
                        colors={[Colors.primary, '#FF8533']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.addGradient}
                    >
                        <Plus size={16} color="#FFF" strokeWidth={2.5} />
                        <Text style={styles.addText}>Add</Text>
                    </LinearGradient>
                </Pressable>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[Colors.primary]} />}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Month Selector */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={styles.monthNav}>
                        <Pressable onPress={() => navigateMonth(-1)} style={styles.monthArrow}>
                            <ChevronLeft size={20} color="#1E293B" />
                        </Pressable>
                        <Text style={styles.monthLabel}>{getMonthLabel(year, month)}</Text>
                        <Pressable onPress={() => navigateMonth(1)} style={styles.monthArrow}>
                            <ChevronRight size={20} color="#1E293B" />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Calendar Grid */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.calendarCard}>
                        <View style={styles.weekRow}>
                            {WEEKDAYS.map((d) => (
                                <Text key={d} style={styles.weekDay}>{d}</Text>
                            ))}
                        </View>
                        <View style={styles.daysGrid}>
                            {calendarDays.map((day, i) => {
                                if (day === null) return <View key={`e-${i}`} style={styles.dayCell} />;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const info = slotCountByDate[dateStr];
                                const past = isPast(day);
                                const sel = isSelected(day);
                                const tod = isToday(day);

                                return (
                                    <Pressable
                                        key={`d-${day}`}
                                        onPress={() => !past && handleDayPress(day)}
                                        style={[styles.dayCell, sel && styles.dayCellSelected, past && styles.dayCellPast]}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            tod && styles.dayTextToday,
                                            sel && styles.dayTextSelected,
                                            past && styles.dayTextPast,
                                        ]}>{day}</Text>
                                        {info && (
                                            <View style={styles.dotRow}>
                                                <View style={[styles.dot, { backgroundColor: info.booked === info.total ? '#EF4444' : Colors.primary }]} />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                                <Text style={styles.legendText}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.legendText}>Fully Booked</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Slots for Selected Day */}
                {selectedDate && (
                    <Animated.View entering={FadeIn.duration(300)}>
                        <Text style={styles.daySlotTitle}>
                            Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </Text>
                        {slotsForDate.length === 0 ? (
                            <View style={styles.emptyDay}>
                                <CalendarIcon size={24} color="#CBD5E1" strokeWidth={1.5} />
                                <Text style={styles.emptyDayText}>No slots for this day</Text>
                                <Pressable onPress={() => setShowAddModal(true)} style={styles.emptyDayBtn}>
                                    <Text style={styles.emptyDayBtnText}>+ Add Slots</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.slotsList}>
                                {slotsForDate.map((slot, idx) => (
                                    <Animated.View key={slot.id} entering={FadeInDown.delay(idx * 60).springify()}>
                                        <View style={[styles.slotCard, slot.isBooked && styles.slotCardBooked]}>
                                            <View style={styles.slotLeft}>
                                                <Clock size={14} color={slot.isBooked ? '#EF4444' : Colors.primary} strokeWidth={2} />
                                                <Text style={styles.slotTime}>
                                                    {slot.startTime} – {slot.endTime}
                                                </Text>
                                            </View>
                                            <View style={styles.slotRight}>
                                                {slot.agent?.user?.name && (
                                                    <View style={styles.agentPill}>
                                                        <UserIcon size={10} color="#64748B" />
                                                        <Text style={styles.agentName}>{slot.agent.user.name}</Text>
                                                    </View>
                                                )}
                                                <View style={[
                                                    styles.statusPill,
                                                    { backgroundColor: slot.isBooked ? '#FEF2F2' : '#F0FDF4' },
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        { color: slot.isBooked ? '#EF4444' : '#22C55E' },
                                                    ]}>
                                                        {slot.isBooked ? 'Booked' : 'Open'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                )}
            </ScrollView>

            {/* Add Slot Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Slots</Text>
                        <Pressable onPress={() => setShowAddModal(false)} style={styles.modalClose}>
                            <Text style={styles.modalCloseText}>✕</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalDateLabel}>
                            {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>

                        <Text style={styles.modalSectionTitle}>Select Time Slots</Text>
                        <View style={styles.timeGrid}>
                            {TIME_SLOTS.map((ts) => {
                                const key = `${ts.start}-${ts.end}`;
                                const exists = slotsForDate.some(s => s.startTime === ts.start && s.endTime === ts.end);
                                const selected = selectedTimeSlots.includes(key);
                                return (
                                    <Pressable
                                        key={key}
                                        onPress={() => !exists && toggleTimeSlot(key)}
                                        disabled={exists}
                                        style={[
                                            styles.timeChip,
                                            selected && styles.timeChipSelected,
                                            exists && styles.timeChipExists,
                                        ]}
                                    >
                                        <Clock size={14} color={exists ? '#94A3B8' : selected ? '#FFF' : Colors.primary} />
                                        <Text style={[
                                            styles.timeChipText,
                                            selected && styles.timeChipTextSelected,
                                            exists && styles.timeChipTextExists,
                                        ]}>
                                            {ts.label}
                                        </Text>
                                        {exists && <Text style={styles.existsLabel}>Exists</Text>}
                                    </Pressable>
                                );
                            })}
                        </View>

                        {agents.length > 0 && (
                            <>
                                <Text style={styles.modalSectionTitle}>Assign Agent (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.agentScroll}>
                                    <Pressable
                                        onPress={() => setSelectedAgent(null)}
                                        style={[styles.agentOption, !selectedAgent && styles.agentOptionSelected]}
                                    >
                                        <Text style={[styles.agentOptionText, !selectedAgent && styles.agentOptionTextSelected]}>
                                            Unassigned
                                        </Text>
                                    </Pressable>
                                    {agents.filter(a => a.isActive).map((agent) => (
                                        <Pressable
                                            key={agent.id}
                                            onPress={() => setSelectedAgent(agent.id)}
                                            style={[styles.agentOption, selectedAgent === agent.id && styles.agentOptionSelected]}
                                        >
                                            <Text style={[styles.agentOptionText, selectedAgent === agent.id && styles.agentOptionTextSelected]}>
                                                {agent.user?.name ?? 'Agent'}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Pressable
                            onPress={handleCreateSlots}
                            disabled={creating || selectedTimeSlots.length === 0}
                            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#FF8533']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[styles.createBtn, (creating || selectedTimeSlots.length === 0) && { opacity: 0.5 }]}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.createBtnText}>
                                        Create {selectedTimeSlots.length} Slot{selectedTimeSlots.length !== 1 ? 's' : ''}
                                    </Text>
                                )}
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 100, gap: 16 },

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
    addBtn: { borderRadius: 14, overflow: 'hidden' },
    addGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    addText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    // Month Nav
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthArrow: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    monthLabel: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

    // Calendar
    calendarCard: {
        backgroundColor: '#FFF', borderRadius: 22, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    weekRow: { flexDirection: 'row', marginBottom: 8 },
    weekDay: {
        flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700',
        color: '#94A3B8', textTransform: 'uppercase',
    },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
        width: '14.285%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
        borderRadius: 12,
    },
    dayCellSelected: { backgroundColor: Colors.primary },
    dayCellPast: { opacity: 0.35 },
    dayText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    dayTextToday: { color: Colors.primary, fontWeight: '900' },
    dayTextSelected: { color: '#FFF', fontWeight: '800' },
    dayTextPast: { color: '#94A3B8' },
    dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
    dot: { width: 5, height: 5, borderRadius: 3 },

    legend: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

    // Day slots
    daySlotTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    emptyDay: {
        alignItems: 'center', padding: 32, backgroundColor: '#FFF', borderRadius: 18,
        borderWidth: 1, borderColor: '#F1F5F9', gap: 8,
    },
    emptyDayText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
    emptyDayBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.primary + '12' },
    emptyDayBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

    slotsList: { gap: 8 },
    slotCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: '#F1F5F9',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    slotCardBooked: { borderColor: '#FECACA', backgroundColor: '#FFFBFB' },
    slotLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slotTime: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    slotRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    agentPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    agentName: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalClose: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    modalCloseText: { fontSize: 16, color: '#64748B', fontWeight: '700' },
    modalBody: { padding: Spacing.xl, gap: 16, paddingBottom: 40 },
    modalDateLabel: { fontSize: 15, fontWeight: '700', color: '#64748B' },
    modalSectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 4 },

    timeGrid: { gap: 8 },
    timeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    timeChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    timeChipExists: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', opacity: 0.6 },
    timeChipText: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
    timeChipTextSelected: { color: '#FFF', fontWeight: '700' },
    timeChipTextExists: { color: '#94A3B8' },
    existsLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },

    agentScroll: { marginBottom: 8 },
    agentOption: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', marginRight: 8,
    },
    agentOptionSelected: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
    agentOptionText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    agentOptionTextSelected: { color: Colors.primary, fontWeight: '700' },

    createBtn: {
        alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 16, marginTop: 8,
    },
    createBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
