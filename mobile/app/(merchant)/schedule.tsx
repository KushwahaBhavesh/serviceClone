import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
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

function getDayRange(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
}

function formatDate(d: Date) {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toISODate(d: Date) {
    return d.toISOString().split('T')[0];
}

export default function ScheduleScreen() {
    const [dayOffset, setDayOffset] = useState(0);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const selectedDate = getDayRange(dayOffset);
    const dateStr = toISODate(selectedDate);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setSelectedSlots([]);
        try {
            const [slotsRes, agentsRes] = await Promise.all([
                merchantApi.listSlots(dateStr),
                merchantApi.listAgents(),
            ]);
            setSlots(slotsRes.data.slots);
            setAgents(agentsRes.data.agents);
        } catch {
            Alert.alert('Error', 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    }, [dateStr]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleSlotSelection = (key: string) => {
        setSelectedSlots((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
    };

    const handleCreateSlots = async () => {
        if (selectedSlots.length === 0) {
            Alert.alert('Select Slots', 'Please select at least one time slot to create');
            return;
        }
        setCreating(true);
        try {
            const slotsPayload = selectedSlots.map((key) => {
                const [start, end] = key.split('-');
                return { startTime: start, endTime: end };
            });
            const res = await merchantApi.createSlots({ date: dateStr, slots: slotsPayload });
            Alert.alert('Success', `${res.data.created} slot(s) created`);
            fetchData();
        } catch {
            Alert.alert('Error', 'Failed to create slots');
        } finally {
            setCreating(false);
        }
    };

    const isSlotBooked = (start: string, end: string) =>
        slots.some((s) => s.startTime === start && s.endTime === end && s.isBooked);
    const isSlotExisting = (start: string, end: string) =>
        slots.some((s) => s.startTime === start && s.endTime === end);

    const days = Array.from({ length: 7 }, (_, i) => i);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Schedule</Text>

            {/* Day Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPicker}>
                {days.map((offset) => {
                    const d = getDayRange(offset);
                    const isSelected = offset === dayOffset;
                    return (
                        <TouchableOpacity
                            key={offset}
                            style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                            onPress={() => setDayOffset(offset)}
                        >
                            <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                                {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                                {d.getDate()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.slotsContainer}>
                    {/* Slot Grid */}
                    {TIME_SLOTS.map(({ start, end }) => {
                        const key = `${start}-${end}`;
                        const existing = isSlotExisting(start, end);
                        const booked = isSlotBooked(start, end);
                        const selected = selectedSlots.includes(key);
                        const slot = slots.find((s) => s.startTime === start && s.endTime === end);

                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.slotRow,
                                    existing && styles.slotExisting,
                                    booked && styles.slotBooked,
                                    selected && styles.slotSelected,
                                ]}
                                onPress={() => !existing && !booked && toggleSlotSelection(key)}
                                disabled={existing || booked}
                                activeOpacity={existing || booked ? 1 : 0.7}
                            >
                                <View style={styles.slotTime}>
                                    <Text style={styles.slotTimeText}>{start}</Text>
                                    <Text style={styles.slotSep}>—</Text>
                                    <Text style={styles.slotTimeText}>{end}</Text>
                                </View>
                                <View style={styles.slotMeta}>
                                    {booked ? (
                                        <>
                                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                                            <Text style={[styles.slotStatus, { color: Colors.success }]}>Booked</Text>
                                            {slot?.agent && <Text style={styles.slotAgent}>{slot.agent.user?.name}</Text>}
                                        </>
                                    ) : existing ? (
                                        <>
                                            <Ionicons name="radio-button-on" size={16} color={Colors.secondary} />
                                            <Text style={[styles.slotStatus, { color: Colors.secondary }]}>Open</Text>
                                        </>
                                    ) : selected ? (
                                        <>
                                            <Ionicons name="add-circle" size={16} color={Colors.primary} />
                                            <Text style={[styles.slotStatus, { color: Colors.primary }]}>Selected</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="add" size={16} color={Colors.textMuted} />
                                            <Text style={[styles.slotStatus, { color: Colors.textMuted }]}>Add Slot</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Summary */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryDot} />
                            <Text style={styles.summaryText}>Open slots: {slots.filter((s) => !s.isBooked).length}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryDot, { backgroundColor: Colors.success }]} />
                            <Text style={styles.summaryText}>Booked: {slots.filter((s) => s.isBooked).length}</Text>
                        </View>
                    </View>

                    {selectedSlots.length > 0 && (
                        <TouchableOpacity
                            style={[styles.createBtn, creating && { opacity: 0.6 }]}
                            onPress={handleCreateSlots}
                            disabled={creating}
                        >
                            {creating ? <ActivityIndicator color={Colors.textOnPrimary} /> : (
                                <Text style={styles.createBtnText}>Create {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''}</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    dayPicker: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    dayBtn: { width: 52, height: 62, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, gap: 2 },
    dayBtnActive: { backgroundColor: Colors.primary },
    dayLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
    dayLabelActive: { color: Colors.textOnPrimary },
    dayNum: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
    dayNumActive: { color: Colors.textOnPrimary },
    dateLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    slotsContainer: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
    slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    slotExisting: { borderColor: Colors.secondary + '50', backgroundColor: Colors.secondary + '08' },
    slotBooked: { borderColor: Colors.success + '50', backgroundColor: Colors.success + '08' },
    slotSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
    slotTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    slotTimeText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
    slotSep: { fontSize: FontSize.xs, color: Colors.textMuted },
    slotMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    slotStatus: { fontSize: FontSize.sm, fontWeight: '600' },
    slotAgent: { fontSize: FontSize.xs, color: Colors.textSecondary },
    summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: 6 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    summaryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary },
    summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
    createBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: 'center' },
    createBtnText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textOnPrimary },
});
