import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface ImmersiveHeroProps {
    user: any;
    onProfilePress: () => void;
    onSearchPress: () => void;
}

export function ImmersiveHero({ user, onProfilePress, onSearchPress }: ImmersiveHeroProps) {
    const insets = useSafeAreaInsets();
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primary, '#FF8533', '#FFB380']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { paddingTop: insets.top + Spacing.md }]}
            >
                {/* Decorative Shapes */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />

                <View style={styles.header}>
                    <View style={styles.greetingSection}>
                        <Text style={styles.greetingText}>{greeting},</Text>
                        <Text style={styles.nameText}>{user?.name?.split(' ')[0] || 'Guest'} 👋</Text>
                    </View>
                    <Pressable style={styles.avatarContainer} onPress={onProfilePress}>
                        {user?.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color={Colors.primary} />
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>What service do you{"\n"}need today?</Text>
                </View>

                {/* Floating Search Bar */}
                <View style={styles.searchWrapper}>
                    <Pressable style={styles.searchBar} onPress={onSearchPress}>
                        <Ionicons name="search" size={20} color={Colors.textMuted} />
                        <Text style={styles.searchPlaceholder}>Search for services...</Text>
                        <View style={styles.searchBtn}>
                            <Ionicons name="options-outline" size={20} color="#FFF" />
                        </View>
                    </Pressable>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: Colors.background,
    },
    gradient: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        zIndex: 10,
    },
    greetingSection: {
        flex: 1,
    },
    greetingText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    nameText: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: '800',
        marginTop: 2,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
        backgroundColor: '#FFF',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        marginBottom: Spacing.xl * 1.5,
        zIndex: 10,
    },
    heroTitle: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: '900',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    searchWrapper: {
        position: 'absolute',
        bottom: 20,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        height: 60,
        borderRadius: 24,
        paddingHorizontal: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    searchBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: Colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle2: {
        position: 'absolute',
        bottom: 20,
        left: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});
