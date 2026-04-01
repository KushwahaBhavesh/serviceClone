import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to ServeIQ',
        subtitle: 'PREMIUM SERVICES',
        description: 'Your ultimate on-demand service platform connecting you to the best professionals in town.',
        icon: 'sparkles-outline' as const,
    },
    {
        id: '2',
        title: 'Book with Ease',
        subtitle: 'SEAMLESS EXPERIENCE',
        description: 'Find, book, and manage services right from your phone. Fast, reliable, and secure.',
        icon: 'calendar-outline' as const,
    },
    {
        id: '3',
        title: 'Get Started Today',
        subtitle: 'JOIN THE COMMUNITY',
        description: 'Join thousands of users enjoying hassle-free home services. Your journey starts here.',
        icon: 'rocket-outline' as const,
    }
];

export default function IntroScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { completeIntroOnboarding } = useAuthStore();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const handleFinish = async () => {
        await completeIntroOnboarding();
        router.replace('/(auth)/welcome');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={styles.bgContainer}>
                <View style={[styles.decoration, styles.decor1]} />
                <View style={[styles.decoration, styles.decor2]} />
            </View>

            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                {SLIDES.map((slide, index) => (
                    <View key={slide.id} style={[styles.slide, { paddingTop: insets.top + Spacing.xxl }]}>
                        <Animated.View 
                            entering={FadeInDown.delay(100).duration(800)}
                            style={styles.imageContainer}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#F8FAFC']}
                                style={styles.imagePlaceholder}
                            >
                                <View style={styles.iconCircle}>
                                    <Ionicons name={slide.icon} size={64} color={Colors.primary} />
                                </View>
                                <View style={styles.glowCircle} />
                            </LinearGradient>
                        </Animated.View>
                        
                        <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.textContainer}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{slide.subtitle}</Text>
                            </View>
                            <Text style={styles.title}>{slide.title}</Text>
                            <Text style={styles.description}>{slide.description}</Text>
                        </Animated.View>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                <Animated.View entering={FadeInUp.delay(500)} style={styles.buttonContainer}>
                    {currentIndex === SLIDES.length - 1 ? (
                        <Pressable
                            onPress={handleFinish}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#E66100']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.buttonText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={styles.skipButton}
                            onPress={() => router.replace('/(auth)/welcome')}
                        >
                            <Text style={styles.skipText}>Skip Intro</Text>
                        </Pressable>
                    )}
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    decoration: {
        position: 'absolute',
        borderRadius: 100,
    },
    decor1: {
        width: 250,
        height: 250,
        backgroundColor: Colors.primary + '08',
        top: -80,
        right: -80,
    },
    decor2: {
        width: 150,
        height: 150,
        backgroundColor: Colors.secondary + '08',
        bottom: '10%',
        left: -50,
    },
    scrollContent: {
        alignItems: 'center',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    imageContainer: {
        width: width * 0.75,
        height: width * 0.75,
        marginBottom: Spacing.xxl,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    glowCircle: {
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: Colors.primary + '05',
        position: 'absolute',
        zIndex: 1,
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    badge: {
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 16,
    },
    badgeText: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.textDark,
        textAlign: 'center',
        marginBottom: Spacing.md,
        letterSpacing: -1,
    },
    description: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: Spacing.xl,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 28,
        backgroundColor: Colors.primary,
    },
    buttonContainer: {
        width: '100%',
        height: 64,
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        height: 64,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    skipButton: {
        width: '100%',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '700',
    }
});
