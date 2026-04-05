import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeIn,
    SlideInDown,
} from 'react-native-reanimated';
import {
    ChevronLeft,
    Briefcase,
    Tag,
    Check,
    ChevronRight,
    Sparkles,
} from 'lucide-react-native';

import { Colors, Spacing } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { AuthDecorations } from '../../components/ui/AuthDecorations';

const { width } = Dimensions.get('window');

const GLASS_WHITE = 'rgba(0, 0, 0, 0.02)';
const GLASS_BORDER = 'rgba(0, 0, 0, 0.05)';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const { role, email, name } = useLocalSearchParams<{ role: string; email: string; name?: string }>();
    const insets = useSafeAreaInsets();
    const { showInfo, showSuccess } = useToast();

    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');

    const handleContinue = () => {
        if (!businessName.trim() || !businessCategory.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showInfo('Please enter your business name and category.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        router.push({
            pathname: '/(onboarding)/location',
            params: {
                role,
                email,
                name,
                businessName: businessName.trim(),
                businessCategory: businessCategory.trim()
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" translucent />

            {/* ─── Header ─── */}
            <View style={[styles.stickyHeader, { height: insets.top + 60 }]}>
                <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <Pressable onPress={() => router.back()} style={styles.navBtn}>
                        <ChevronLeft size={22} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Business Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.heroBox}>
                        <Text style={styles.title}>Business Details</Text>
                        <Text style={styles.subtitle}>Define your professional business identity for the marketplace.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                        <Text style={styles.sectionLabel}>IDENTITY & BRANDING</Text>

                        <Input
                            label="LEGAL BUSINESS NAME"
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder="e.g. Acme Services Co."
                            leftIcon={<Briefcase size={20} color={Colors.primary} />}
                        />

                        <View style={{ height: Spacing.md }} />

                        <Input
                            label="PRIMARY SERVICE CATEGORY"
                            value={businessCategory}
                            onChangeText={setBusinessCategory}
                            placeholder="e.g. Advanced Electrical"
                            leftIcon={<Tag size={20} color={Colors.primary} />}
                        />

                        <Animated.View entering={FadeIn.delay(500)} style={styles.infoBox}>
                            <Check size={14} color="#059669" strokeWidth={2.5} />
                            <Text style={styles.infoText}>This identity will be verified against your legal documents.</Text>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Animated.View
                entering={SlideInDown.springify()}
                style={[styles.footer, { paddingBottom: insets.bottom }]}
            >
                <Pressable
                    onPress={handleContinue}
                    disabled={!businessName.trim() || !businessCategory.trim()}
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && { transform: [{ scale: 0.98 }] },
                        (!businessName.trim() || !businessCategory.trim()) && styles.btnDisabled
                    ]}
                >
                    <LinearGradient
                        colors={[Colors.primary, '#FF7A00']}
                        style={styles.btnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.btnText}>VALIDATE & CONTINUE</Text>
                        <ChevronRight size={22} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flex: { flex: 1 },

    // Header
    stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    navBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

    scrollContent: { paddingHorizontal: 25 },

    // Hero
    heroBox: { marginBottom: 30 },
    title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#64748B', marginTop: 8, lineHeight: 22 },

    // Section
    section: { marginTop: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },

    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    infoText: { fontSize: 13, color: '#166534', fontWeight: '500', flex: 1 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 25, right: 25, zIndex: 100 },
    primaryBtn: { height: 64, borderRadius: 16, overflow: 'hidden' },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    btnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    btnDisabled: { opacity: 0.5 },
});
