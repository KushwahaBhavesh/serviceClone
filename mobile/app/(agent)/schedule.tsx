import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, Switch, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
    ChevronLeft, Clock, Calendar, Wifi, WifiOff,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing } from '../../constants/theme';
import { agentApi, AgentDashboard } from '../../lib/agent';
import { useToast } from '../../context/ToastContext';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = [
    { label: 'Morning', time: '8:00 AM – 12:00 PM', icon: '🌅' },
    { label: 'Afternoon', time: '12:00 PM – 4:00 PM', icon: '☀️' },
    { label: 'Evening', time: '4:00 PM – 8:00 PM', icon: '🌇' },
];

export default function AgentScheduleScreen() {
    const insets = useSafeAreaInsets();
    const { showSuccess, showError } = useToast();
    const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
    const [toggling, setToggling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const isOnline = dashboard?.status === 'AVAILABLE';
    const today = useMemo(() => new Date().getDay(), []);
    // Convert JS day (0=Sun) to our index (0=Mon)
    const todayIndex = today === 0 ? 6 : today - 1;

    const fetchData = useCallback(async () => {
        try {
            const { data } = await agentApi.getDashboard();
            setDashboard(data);
        } catch { showError('Failed to load status'); }
        finally { setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const toggleStatus = async (value: boolean) => {
        if (!dashboard || toggling) return;
        setToggling(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const prev = dashboard.status;
        setDashboard({ ...dashboard, status: value ? 'AVAILABLE' : 'OFFLINE' });
        try {
            await agentApi.updateAvailability(value);
            showSuccess(value ? "You're now online!" : "You're offline");
        } catch {
            setDashboard({ ...dashboard, status: prev });
            showError('Failed to update status');
        } finally { setToggling(false); }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Schedule & Availability</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[Colors.primary]} />}
            >
                {/* Online/Offline Toggle */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={[styles.statusCard, isOnline ? styles.statusOnline : styles.statusOffline]}>
                        <View style={styles.statusLeft}>
                            <View style={[styles.statusIconWrap, { backgroundColor: isOnline ? '#22C55E20' : '#94A3B820' }]}>
                                {isOnline ? (
                                    <Wifi size={22} color="#22C55E" strokeWidth={2.5} />
                                ) : (
                                    <WifiOff size={22} color="#94A3B8" strokeWidth={2.5} />
                                )}
                            </View>
                            <View>
                                <Text style={styles.statusTitle}>
                                    {isOnline ? "You're Online" : "You're Offline"}
                                </Text>
                                <Text style={styles.statusHint}>
                                    {isOnline ? 'Receiving new job requests' : 'Go online to receive jobs'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isOnline}
                            onValueChange={toggleStatus}
                            disabled={toggling}
                            trackColor={{ false: '#E2E8F0', true: '#22C55E50' }}
                            thumbColor={isOnline ? '#22C55E' : '#94A3B8'}
                        />
                    </View>
                </Animated.View>

                {/* Weekly View */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Calendar size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.sectionTitle}>This Week</Text>
                        </View>
                        <View style={styles.weekRow}>
                            {WEEKDAYS.map((day, i) => {
                                const isToday = i === todayIndex;
                                return (
                                    <View key={day} style={[styles.weekDay, isToday && styles.weekDayToday]}>
                                        <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{day}</Text>
                                        <View style={[
                                            styles.weekDayDot,
                                            { backgroundColor: isToday && isOnline ? '#22C55E' : isToday ? Colors.primary : '#E2E8F0' },
                                        ]} />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>

                {/* Shift Times (Informational) */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Clock size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Shift Times</Text>
                        </View>
                        <Text style={styles.shiftHint}>Your availability is managed by going online/offline</Text>
                        {SHIFTS.map((shift, i) => (
                            <View key={shift.label} style={styles.shiftRow}>
                                <Text style={styles.shiftIcon}>{shift.icon}</Text>
                                <View style={styles.shiftInfo}>
                                    <Text style={styles.shiftLabel}>{shift.label}</Text>
                                    <Text style={styles.shiftTime}>{shift.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Tips Card */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <View style={styles.tipCard}>
                        <Text style={styles.tipEmoji}>💡</Text>
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Stay online during peak hours</Text>
                            <Text style={styles.tipText}>
                                Morning (8-10 AM) and evening (5-8 PM) have the highest demand. Keep your availability on to maximize your earnings.
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: Spacing.lg, paddingBottom: 100, gap: 16 },

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

    // Status Card
    statusCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 18, borderRadius: 22,
        borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    },
    statusOnline: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    statusOffline: { backgroundColor: '#FFF', borderColor: '#F1F5F9' },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    statusIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    statusTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    statusHint: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 },

    // Section
    section: {
        backgroundColor: '#FFF', borderRadius: 22, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    weekDay: { alignItems: 'center', gap: 8, flex: 1 },
    weekDayToday: {},
    weekDayLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    weekDayLabelToday: { color: Colors.primary, fontWeight: '800' },
    weekDayDot: { width: 8, height: 8, borderRadius: 4 },

    shiftHint: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginBottom: 12 },
    shiftRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    },
    shiftIcon: { fontSize: 20 },
    shiftInfo: { flex: 1 },
    shiftLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    shiftTime: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 },

    // Tip
    tipCard: {
        flexDirection: 'row', gap: 14, padding: 16, borderRadius: 18,
        backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
    },
    tipEmoji: { fontSize: 24 },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
    tipText: { fontSize: 12, fontWeight: '500', color: '#92400E', lineHeight: 18, marginTop: 4 },
});
