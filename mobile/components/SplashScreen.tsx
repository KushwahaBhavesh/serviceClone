import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../constants/theme';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>S</Text>
                    <View style={styles.logoGlow} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.appName}>ServeIQ</Text>
                    <View style={styles.taglineWrapper}>
                        <View style={styles.line} />
                        <Text style={styles.tagline}>PREMIUM SERVICES</Text>
                        <View style={styles.line} />
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Secure & Reliable</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        backgroundColor: Colors.primary,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        elevation: 15,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    logoText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    logoGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#FFFFFF40',
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 40,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    taglineWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    line: {
        height: 1,
        width: 20,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 10,
    },
    tagline: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    }
});
