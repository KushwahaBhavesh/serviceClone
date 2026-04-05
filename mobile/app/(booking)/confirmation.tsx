import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { 
    CheckCircle2, 
    Bell, 
    MessageSquare, 
    ShieldCheck, 
    ChevronRight, 
    LayoutList,
    Home
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ConfirmationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const pulseValue = useSharedValue(1);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: interpolate(pulseValue.value, [1, 1.1], [0.8, 0.3], Extrapolate.CLAMP),
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.content}>
                {/* Celebration Header */}
                <View style={styles.celebrationWrap}>
                    <Animated.View style={[styles.pulseRing, pulseStyle]} />
                    <Animated.View entering={FadeInUp.springify()} style={styles.iconBox}>
                        <LinearGradient 
                            colors={[Colors.primary, '#FF7A00']} 
                            style={styles.iconGradient}
                        >
                            <CheckCircle2 size={48} color="#FFF" strokeWidth={3} />
                        </LinearGradient>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.textWrap}>
                    <Text style={styles.title}>BOOKING CONFIRMED</Text>
                    <Text style={styles.subtitle}>
                        Your request has been successfully received. A service professional will be assigned to your booking shortly.
                    </Text>
                </Animated.View>

                {/* Info Bento */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.bentoContainer}>
                    <View style={styles.bentoItem}>
                        <View style={styles.bentoIcon}><Bell size={18} color={Colors.primary} /></View>
                        <View style={styles.bentoInfo}>
                            <Text style={styles.bentoTitle}>LIVE UPDATES</Text>
                            <Text style={styles.bentoSub}>We'll notify you once a professional is assigned.</Text>
                        </View>
                    </View>
                    <View style={styles.bentoItem}>
                        <View style={styles.bentoIcon}><MessageSquare size={18} color={Colors.primary} /></View>
                        <View style={styles.bentoInfo}>
                            <Text style={styles.bentoTitle}>CHAT SUPPORT</Text>
                            <Text style={styles.bentoSub}>Message your professional directly via the app.</Text>
                        </View>
                    </View>
                    <View style={styles.bentoItem}>
                        <View style={styles.bentoIcon}><ShieldCheck size={18} color={Colors.primary} /></View>
                        <View style={styles.bentoInfo}>
                            <Text style={styles.bentoTitle}>SERVICE GUARANTEE</Text>
                            <Text style={styles.bentoSub}>Quality assurance and priority support included.</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Bottom Actions */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.bottomContent}>
                    <Pressable 
                        style={styles.secondaryBtn} 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.replace('/(tabs)/bookings');
                        }}
                    >
                        <View style={styles.secBtnContent}>
                            <LayoutList size={22} color="#111" />
                            <Text style={styles.secBtnText}>BOOKINGS</Text>
                        </View>
                    </Pressable>
                    <Pressable 
                        style={styles.mainCta}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            router.replace('/(tabs)/home');
                        }}
                    >
                        <View style={styles.ctaInner}>
                            <Text style={styles.ctaText}>RETURN HOME</Text>
                            <ChevronRight size={18} color="#FFF" strokeWidth={3.5} />
                        </View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 35 },
    
    // Celebration
    celebrationWrap: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.primary, opacity: 0.1 },
    iconBox: { width: 110, height: 110, borderRadius: 45, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
    iconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    textWrap: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: 1.5, marginBottom: 15 },
    subtitle: { fontSize: 13, fontWeight: '600', color: '#AAA', textAlign: 'center', lineHeight: 22 },

    // Bento
    bentoContainer: { width: '100%', gap: 15 },
    bentoItem: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#FAFAFA', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#F0F0F0' },
    bentoIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    bentoInfo: { flex: 1 },
    bentoTitle: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1 },
    bentoSub: { fontSize: 11, fontWeight: '600', color: '#AAA', marginTop: 4 },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    bottomContent: { flexDirection: 'row', padding: 20, gap: 15 },
    secondaryBtn: { width: 70, height: 60, borderRadius: 20, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
    secBtnContent: { alignItems: 'center', gap: 4 },
    secBtnText: { fontSize: 8, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
    mainCta: { flex: 1, height: 60, borderRadius: 20, backgroundColor: Colors.primary, overflow: 'hidden' },
    ctaInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    ctaText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
});
