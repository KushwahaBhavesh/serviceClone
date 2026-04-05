import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Sparkles, Zap, Shield, CircleDot } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const AuthDecorations = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Top Right Main Illustration */}
            <View style={[styles.decorBase, styles.topRight]}>
                <Sparkles 
                    size={Math.min(width * 0.6, 250)} 
                    color={Colors.primary} 
                    strokeWidth={0.5} 
                    opacity={0.07} 
                />
            </View>

            {/* Bottom Left Support Illustration */}
            <View style={[styles.decorBase, styles.bottomLeft]}>
                <Zap 
                    size={160} 
                    color={Colors.secondary} 
                    strokeWidth={0.5} 
                    opacity={0.06} 
                />
            </View>

            {/* Mid Right Accent */}
            <View style={[styles.decorBase, styles.midRight]}>
                <Shield 
                    size={100} 
                    color={Colors.primary} 
                    strokeWidth={0.8} 
                    opacity={0.04} 
                />
            </View>

             {/* Small Floating Dots */}
             <View style={[styles.decorBase, styles.dot1]}>
                <CircleDot size={24} color={Colors.primary} opacity={0.1} />
            </View>
            <View style={[styles.decorBase, styles.dot2]}>
                <CircleDot size={16} color={Colors.secondary} opacity={0.08} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    decorBase: {
        position: 'absolute',
    },
    topRight: {
        top: -40,
        right: -40,
        transform: [{ rotate: '15deg' }],
    },
    bottomLeft: {
        bottom: '10%',
        left: -30,
        transform: [{ rotate: '-15deg' }],
    },
    midRight: {
        top: '45%',
        right: -20,
        transform: [{ rotate: '-10deg' }],
    },
    dot1: {
        top: '20%',
        left: '10%',
    },
    dot2: {
        bottom: '25%',
        right: '15%',
    },
});
