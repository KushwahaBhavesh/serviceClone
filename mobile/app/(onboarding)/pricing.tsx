import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

type PlanTier = 'STARTER' | 'PRO' | 'ELITE';

const PLANS = [
    {
        id: 'STARTER' as PlanTier,
        name: 'Starter',
        price: 'Free',
        commission: '10% fee per job',
        features: ['Basic merchant listing', '1 Agent account', 'Standard support'],
        popular: false,
    },
    {
        id: 'PRO' as PlanTier,
        name: 'Pro',
        price: '$29/mo',
        commission: '5% fee per job',
        features: ['Priority search ranking', 'Up to 3 Agent accounts', 'Analytics dashboard', 'Priority support'],
        popular: true,
    },
    {
        id: 'ELITE' as PlanTier,
        name: 'Elite',
        price: '$99/mo',
        commission: '0% fee - keep 100%',
        features: ['Premium verifying badge', 'Unlimited Agents', 'Advanced API access', 'Dedicated account manager'],
        popular: false,
    }
];

export default function PricingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { completeOnboarding, isLoading } = useAuthStore();
    
    const [selectedPlan, setSelectedPlan] = useState<PlanTier>('PRO');

    const handleComplete = async () => {
        try {
            const cleanStr = (val: string | string[] | undefined) => {
                if (!val || val === 'null' || val === 'undefined') return undefined;
                return Array.isArray(val) ? val[0] : val;
            };

            await completeOnboarding({
                role: (cleanStr(params.role) as any) || 'MERCHANT',
                email: cleanStr(params.email),
                businessName: cleanStr(params.businessName),
                businessCategory: cleanStr(params.businessCategory),
                locationName: cleanStr(params.locationName),
                latitude: Number(params.latitude),
                longitude: Number(params.longitude),
                selectedPlan
            });
            // Router redirect is handled automatically via AuthGate in _layout.tsx
        } catch (error: any) {
            Alert.alert('Onboarding Failed', error.message || 'Something went wrong.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl, paddingBottom: 120 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Choose your Plan</Text>
                    <Text style={styles.subtitle}>Select the best subscription tier to scale your service business.</Text>
                </View>

                <View style={styles.plansContainer}>
                    {PLANS.map((plan, index) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <Animated.View 
                                key={plan.id} 
                                entering={FadeInUp.delay(index * 150).springify()}
                            >
                                <Pressable
                                    style={[
                                        styles.planCard,
                                        isSelected && styles.planCardActive
                                    ]}
                                    onPress={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.popular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>MOST POPULAR</Text>
                                        </View>
                                    )}
                                    
                                    <View style={styles.planHeader}>
                                        <View>
                                            <Text style={styles.planName}>{plan.name}</Text>
                                            <Text style={styles.planPrice}>{plan.price}</Text>
                                        </View>
                                        <View style={[styles.radio, isSelected && styles.radioActive]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />
                                    
                                    <View style={styles.commissionRow}>
                                        <Ionicons name="receipt" size={16} color={isSelected ? Colors.primary : '#64748B'} />
                                        <Text style={[styles.commissionText, isSelected && { color: Colors.primary }]}>
                                            {plan.commission}
                                        </Text>
                                    </View>

                                    <View style={styles.featuresList}>
                                        {plan.features.map((feature, fIdx) => (
                                            <View key={fIdx} style={styles.featureRow}>
                                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Button
                    title="Start Subscription"
                    onPress={handleComplete}
                    loading={isLoading}
                    disabled={isLoading}
                    variant="primary"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    plansContainer: {
        gap: 16,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    planCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFaf5', // Very light orange tint
        shadowColor: Colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#64748B',
    },
    planPrice: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 4,
        letterSpacing: -1,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    commissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    commissionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    featuresList: {
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        backgroundColor: 'rgba(248, 250, 252, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
});
