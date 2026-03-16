import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const FAQS = [
    {
        question: 'How do I mark a job as completed?',
        answer: 'Navigate to the Job Details screen, perform the work, and then use the "Proof of Work" section to add photos. Once photos are added, the "Complete Job" button will become active.'
    },
    {
        question: 'What should I do if the customer is not home?',
        answer: 'Try calling the customer using the call button in Job Details. If they are unavailable, contact support or mark the job accordingly as per mission guidelines.'
    },
    {
        question: 'How am I paid?',
        answer: 'Earnings are calculated based on completed jobs and bonuses. You can view your current balance in the "Earnings" tab. Payouts are processed weekly.'
    },
    {
        question: 'How do I update my availability?',
        answer: 'On your Dashboard, use the toggle switch at the top to go "Online" or "Offline". Tracking only occurs while you are online.'
    }
];

export default function SupportScreen() {
    const router = useRouter();

    const contactSupport = (method: 'phone' | 'email' | 'chat') => {
        // Mock contact logic
        switch (method) {
            case 'phone':
                Linking.openURL('tel:+1234567890');
                break;
            case 'email':
                Linking.openURL('mailto:support@nexus.com');
                break;
            case 'chat':
                // navigate to a generic support chat if implemented
                alert('Support chat coming soon!');
                break;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.section, styles.heroCard]}>
                    <Ionicons name="help-buoy" size={48} color={Colors.primary} />
                    <Text style={styles.heroTitle}>How can we help you?</Text>
                    <Text style={styles.heroSubtitle}>Check our FAQs or reach out directly</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {FAQS.map((faq, index) => (
                        <View key={index} style={styles.faqCard}>
                            <Text style={styles.question}>{faq.question}</Text>
                            <Text style={styles.answer}>{faq.answer}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <View style={styles.contactGrid}>
                        <TouchableOpacity
                            style={styles.contactCard}
                            onPress={() => contactSupport('phone')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '15' }]}>
                                <Ionicons name="call" size={24} color={Colors.primary} />
                            </View>
                            <Text style={styles.contactLabel}>Phone</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactCard}
                            onPress={() => contactSupport('email')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: Colors.secondary + '15' }]}>
                                <Ionicons name="mail" size={24} color={Colors.secondary} />
                            </View>
                            <Text style={styles.contactLabel}>Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactCard}
                            onPress={() => contactSupport('chat')}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: Colors.success + '15' }]}>
                                <Ionicons name="chatbubbles" size={24} color={Colors.success} />
                            </View>
                            <Text style={styles.contactLabel}>Live Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    content: { padding: Spacing.lg },

    heroCard: {
        backgroundColor: Colors.backgroundAlt,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroTitle: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
        marginTop: Spacing.md,
    },
    heroSubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        marginTop: 4,
    },

    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },

    faqCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    question: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    answer: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },

    contactGrid: { flexDirection: 'row', gap: Spacing.md },
    contactCard: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});
