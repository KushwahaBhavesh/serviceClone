import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const { role, email, name } = useLocalSearchParams<{ role: string; email: string; name?: string }>();
    const insets = useSafeAreaInsets();

    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');

    const handleContinue = () => {
        if (!businessName.trim() || !businessCategory.trim()) {
            Alert.alert('Required Fields', 'Please enter your business name and category.');
            return;
        }

        router.push({
            pathname: '/(onboarding)/location',
            params: {
                role,
                email,
                name,
                businessName,
                businessCategory
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>

                    <View style={styles.header}>
                        <Text style={styles.title}>Business Details</Text>
                        <Text style={styles.subtitle}>Tell us about your service business.</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.sectionLabel}>Core Information</Text>
                        
                        <Input
                            label="Business Name *"
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder="e.g. Acme Plumbing Ltd"
                            containerStyle={styles.inputSpacing}
                        />

                        <Input
                            label="Service Category *"
                            value={businessCategory}
                            onChangeText={setBusinessCategory}
                            placeholder="e.g. Plumbing, Cleaning, Electrical"
                            containerStyle={styles.inputSpacing}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!businessName || !businessCategory}
                    variant="primary"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    flex: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        lineHeight: 24,
    },
    formContainer: {
        marginTop: Spacing.sm,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    inputSpacing: {
        marginBottom: Spacing.lg,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
});
