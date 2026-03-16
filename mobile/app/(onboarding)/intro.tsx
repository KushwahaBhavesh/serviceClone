import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to ServeIQ',
        description: 'Your ultimate on-demand service platform connecting you to the best professionals in town.',
    },
    {
        id: '2',
        title: 'Book with Ease',
        description: 'Find, book, and manage services right from your phone. Fast, reliable, and secure.',
    },
    {
        id: '3',
        title: 'Get Started Today',
        description: 'Join thousands of users enjoying hassle-free home services.',
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
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                {SLIDES.map((slide) => (
                    <View key={slide.id} style={[styles.slide, { paddingTop: insets.top + Spacing.xxl }]}>
                        <View style={styles.imageContainer}>
                            <LinearGradient
                                colors={['#F8FAFC', '#F1F5F9']}
                                style={styles.imagePlaceholder}
                            >
                                <View style={styles.glowCircle} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>{slide.title}</Text>
                        <Text style={styles.description}>{slide.description}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
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

                {currentIndex === SLIDES.length - 1 ? (
                    <Button title="Get Started" onPress={handleFinish} style={styles.button} />
                ) : (
                    <View style={styles.buttonPlaceholder} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: Spacing.xxl,
        position: 'relative',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glowCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primary + '10',
        position: 'absolute',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: Spacing.md,
        letterSpacing: -1,
    },
    description: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: Colors.primary,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 16,
    },
    buttonPlaceholder: {
        height: 56,
    }
});
