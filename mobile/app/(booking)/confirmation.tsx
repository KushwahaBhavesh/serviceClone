import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

export default function ConfirmationScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
                </View>

                <Text style={styles.title}>Booking Confirmed!</Text>
                <Text style={styles.subtitle}>
                    Your service has been booked successfully. You'll receive a confirmation notification shortly.
                </Text>

                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                        <Text style={styles.infoText}>We'll notify you when a provider accepts your booking</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
                        <Text style={styles.infoText}>You can chat with your provider once assigned</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                        <Text style={styles.infoText}>All services come with a 30-day warranty</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <Button
                        title="View My Bookings"
                        onPress={() => router.replace('/(tabs)/bookings')}
                    />
                    <Button
                        title="Back to Home"
                        variant="outline"
                        onPress={() => router.replace('/(tabs)/home')}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    iconCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: Colors.success + '15',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    subtitle: {
        fontSize: FontSize.md, color: Colors.textSecondary,
        textAlign: 'center', marginTop: Spacing.sm, lineHeight: 24,
        paddingHorizontal: Spacing.lg,
    },
    infoBox: {
        width: '100%', marginTop: Spacing.xl,
        backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.xl,
        padding: Spacing.lg, gap: Spacing.md,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
    actions: { width: '100%', marginTop: Spacing.xl, gap: Spacing.md },
});
