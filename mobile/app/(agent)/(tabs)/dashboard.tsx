import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Switch
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { agentApi, AgentDashboard } from '../../../lib/agent';
import { useAgentLocation } from '../../../hooks/useAgentLocation';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export default function AgentDashboardScreen() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toggling, setToggling] = useState(false);

    const isOnline = dashboard?.status === 'AVAILABLE';

    // Track location when online
    useAgentLocation(isOnline);

    const fetchDashboard = useCallback(async () => {
        try {
            const { data } = await agentApi.getDashboard();
            setDashboard(data);
        } catch (error) {
            console.error('Error fetching agent dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const toggleStatus = async (value: boolean) => {
        if (!dashboard || toggling) return;
        setToggling(true);

        // Optimistic update
        const prevStatus = dashboard.status;
        setDashboard({ ...dashboard, status: value ? 'AVAILABLE' : 'OFFLINE' });

        try {
            await agentApi.updateAvailability(value);
        } catch (error) {
            console.error('Failed to toggle status:', error);
            // Revert on failure
            setDashboard({ ...dashboard, status: prevStatus });
        } finally {
            setToggling(false);
        }
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
            <View style={{ height: insets.top, backgroundColor: isOnline ? '#E8F5E9' : Colors.backgroundAlt }} />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.statusWrapper, isOnline ? styles.onlineBg : styles.offlineBg]}>
                    <View style={styles.statusInfo}>
                        <Ionicons
                            name={isOnline ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={isOnline ? Colors.success : Colors.textMuted}
                        />
                        <View>
                            <Text style={styles.statusTitle}>
                                {isOnline ? "You're Online" : "You're Offline"}
                            </Text>
                            <Text style={styles.statusDesc}>
                                {isOnline ? 'Ready to receive new jobs' : 'Go online to get jobs'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleStatus}
                        disabled={toggling}
                        trackColor={{ true: Colors.success, false: Colors.border }}
                        thumbColor="#FFF"
                    />
                </View>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {user?.name}</Text>
                        <Text style={styles.subtitle}>Ready for today's jobs?</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => router.push('/(agent)/notifications')}
                            style={styles.iconButton}
                        >
                            <Ionicons name="notifications" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        icon="briefcase"
                        label="New Jobs"
                        value={dashboard?.todayAssigned || 0}
                        color={Colors.primary}
                    />
                    <StatCard
                        icon="checkmark-done-circle"
                        label="Completed"
                        value={dashboard?.todayCompleted || 0}
                        color={Colors.success}
                    />
                    <StatCard
                        icon="wallet"
                        label="Earnings"
                        value={`$${(dashboard?.todayEarnings || 0).toFixed(2)}`}
                        color={Colors.secondary}
                    />
                    <StatCard
                        icon="star"
                        label="Rating"
                        value={(dashboard?.rating || 0).toFixed(1)}
                        color="#FFB000"
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    content: { padding: Spacing.lg, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    greeting: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
    subtitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

    statusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    onlineBg: {
        backgroundColor: '#E8F5E9',
        borderColor: '#C8E6C9',
    },
    offlineBg: {
        backgroundColor: Colors.backgroundAlt,
        borderColor: Colors.border,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    statusTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    statusDesc: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.background,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
        gap: Spacing.xs,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
        marginTop: Spacing.xs,
    },
    statLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
