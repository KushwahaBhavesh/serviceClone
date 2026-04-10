import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
    ChevronLeft, ChevronDown, ChevronUp, Mail, Phone,
    MessageSquare, HelpCircle, ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing } from '../../../constants/theme';

const FAQS = [
    { q: 'How do I cancel a booking?', a: 'Go to your booking details and tap "Cancel Booking". Cancellations before agent assignment are free. Late cancellations may incur a fee.' },
    { q: "What if the agent doesn't show up?", a: 'If your agent hasn\'t arrived within 15 minutes of the scheduled time, you can cancel for free and request a reassignment through the booking details.' },
    { q: 'How long does a refund take?', a: 'Refunds are processed within 3-5 business days. Wallet refunds are instant. Card/UPI refunds depend on your bank.' },
    { q: 'How do I add money to my wallet?', a: 'Go to Profile → Wallet → Add Money. You can use UPI, cards, or net banking to top up your wallet balance.' },
    { q: 'Can I reschedule a booking?', a: 'Yes, you can reschedule before the agent is en route. Go to booking details and tap "Reschedule" to pick a new time.' },
    { q: 'How is the service price calculated?', a: 'Prices are set by merchants per service unit (per hour, per visit, etc). The final price includes service fee plus applicable taxes.' },
    { q: 'What documents do agents carry?', a: 'All agents carry a verified ID badge issued by the platform. You can verify their identity through the app before starting service.' },
    { q: 'How do I report a service quality issue?', a: 'After service completion, you can rate and review. For serious issues, use "Submit a Request" below or email support.' },
];

export default function SupportScreen() {
    const insets = useSafeAreaInsets();
    const [expanded, setExpanded] = useState<number | null>(null);

    const toggleFaq = (i: number) => setExpanded(prev => prev === i ? null : i);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                    <ChevronLeft size={22} color="#1E293B" />
                </Pressable>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* FAQ */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <HelpCircle size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                        </View>
                        {FAQS.map((faq, i) => (
                            <Pressable key={i} onPress={() => toggleFaq(i)} style={styles.faqItem}>
                                <View style={styles.faqQuestion}>
                                    <Text style={styles.faqQ}>{faq.q}</Text>
                                    {expanded === i ? (
                                        <ChevronUp size={16} color="#94A3B8" />
                                    ) : (
                                        <ChevronDown size={16} color="#94A3B8" />
                                    )}
                                </View>
                                {expanded === i && (
                                    <Text style={styles.faqA}>{faq.a}</Text>
                                )}
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Contact Options */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MessageSquare size={16} color={Colors.primary} strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Contact Us</Text>
                        </View>

                        <Pressable
                            onPress={() => Linking.openURL('mailto:support@serviceclone.com')}
                            style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
                                <Mail size={18} color="#3B82F6" strokeWidth={2} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Email Us</Text>
                                <Text style={styles.contactHint}>support@serviceclone.com</Text>
                            </View>
                            <ExternalLink size={14} color="#94A3B8" />
                        </Pressable>

                        <Pressable
                            onPress={() => Linking.openURL('tel:+911234567890')}
                            style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
                                <Phone size={18} color="#22C55E" strokeWidth={2} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Call Us</Text>
                                <Text style={styles.contactHint}>Mon-Sat, 9 AM–8 PM</Text>
                            </View>
                            <ExternalLink size={14} color="#94A3B8" />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* AI Assistant Link */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Pressable
                        onPress={() => router.push('/(customer)/ai-assistant' as any)}
                        style={({ pressed }) => [styles.aiCard, pressed && { opacity: 0.85 }]}
                    >
                        <Text style={styles.aiEmoji}>🤖</Text>
                        <View style={styles.aiInfo}>
                            <Text style={styles.aiTitle}>AI Assistant</Text>
                            <Text style={styles.aiHint}>Get instant answers to your questions</Text>
                        </View>
                        <ChevronDown size={14} color={Colors.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                    </Pressable>
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
        borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },

    section: {
        backgroundColor: '#FFF', borderRadius: 22, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

    faqItem: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingVertical: 14 },
    faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQ: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1, paddingRight: 10 },
    faqA: { fontSize: 13, fontWeight: '500', color: '#64748B', lineHeight: 20, marginTop: 10 },

    contactRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F8FAFC',
    },
    contactIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    contactHint: { fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 2 },

    aiCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: Colors.primary + '10', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: Colors.primary + '20',
    },
    aiEmoji: { fontSize: 28 },
    aiInfo: { flex: 1 },
    aiTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary },
    aiHint: { fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 },
});
