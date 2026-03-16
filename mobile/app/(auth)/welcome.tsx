import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    ImageBackground,
    Dimensions,
    StyleSheet,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 900);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.skeletonHero, { height: height * 0.6 }]} />
                <View style={styles.skeletonPadding}>
                    <View style={styles.skeletonBar} />
                    <View style={[styles.skeletonBar, { width: '40%' }]} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Full-Screen Hero Visual */}
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000' }}
                style={styles.fullHero}
                resizeMode="cover"
            >
                {/* Advanced Gradient Overlay for Text Legibility */}
                <View style={styles.overlay} />

                {/* Floating Service "Proof" Pills */}
                <View style={[styles.proofContainer, { top: insets.top + 60 }]}>
                    <View style={styles.glassPill}>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                        <Text style={styles.glassText}>Cleaning · $25/hr</Text>
                    </View>
                    <View style={[styles.glassPill, { marginLeft: 12 }]}>
                        <Ionicons name="hammer" size={14} color="#FFF" />
                        <Text style={styles.glassText}>Repairs · Express</Text>
                    </View>
                </View>

                {/* Bottom Content Cluster */}
                <View style={[styles.footerContent, { paddingBottom: insets.bottom + 30 }]}>
                    <Text style={styles.brandTitle}>
                        Home service,{"\n"}
                        <Text style={styles.italicText}>elevated.</Text>
                    </Text>

                    <Text style={styles.description}>
                        Book verified professionals for every corner of your life. Same-day availability guaranteed.
                    </Text>

                    <View style={styles.ctaWrapper}>
                        <Pressable
                            onPress={() => router.push('/(auth)/register')}
                            style={({ pressed }) => [
                                styles.primaryCta,
                                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                            ]}
                        >
                            <Text style={styles.primaryText}>Explore Services</Text>
                            <Ionicons name="chevron-forward" size={18} color="#000" />
                        </Pressable>

                        <View style={styles.secondaryActions}>
                            <Pressable
                                onPress={() => router.push('/(auth)/login')}
                                style={styles.loginBtn}
                            >
                                <Text style={styles.loginText}>Already a member? <Text style={styles.boldText}>Sign In</Text></Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fullHero: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Darken for contrast
    },
    proofContainer: { position: 'absolute', left: 24, flexDirection: 'row' },
    glassPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    glassText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },

    footerContent: { paddingHorizontal: 30 },
    brandTitle: { fontSize: 48, fontWeight: '800', color: '#FFF', lineHeight: 52, letterSpacing: -2 },
    italicText: { fontStyle: 'italic', fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
    description: { fontSize: 17, color: 'rgba(255,255,255,0.7)', marginTop: 20, lineHeight: 26, fontWeight: '500' },

    ctaWrapper: { marginTop: 40 },
    primaryCta: {
        backgroundColor: '#FFF', height: 70, borderRadius: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
    },
    primaryText: { color: '#000', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    secondaryActions: { marginTop: 20, alignItems: 'center' },
    loginBtn: { paddingVertical: 10 },
    loginText: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
    boldText: { color: '#FFF', fontWeight: '700' },

    skeletonHero: { backgroundColor: '#1C1C1E' },
    skeletonPadding: { padding: 30, gap: 12 },
    skeletonBar: { height: 40, backgroundColor: '#2C2C2E', borderRadius: 8, width: '80%' }
});