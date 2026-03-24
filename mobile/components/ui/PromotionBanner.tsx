import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface PromotionBannerProps {
  banner: {
    id: string;
    title: string;
    discount: string;
    subtitle: string;
    color: string;
    merchantId?: string;
  };
  onPress: (merchantId?: string) => void;
}

export function PromotionBanner({ banner, onPress }: PromotionBannerProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(banner.merchantId)}
    >
      <LinearGradient
        colors={[banner.color, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.merchantName}>{banner.title}</Text>
            <Text style={styles.discountText}>{banner.discount}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{banner.subtitle}</Text>
            </View>
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Claim Offer</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.iconSection}>
            <Ionicons
              name="gift-outline"
              size={120}
              color="rgba(255,255,255,0.15)"
              style={styles.bgIcon}
            />
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - Spacing.lg * 2,
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    marginRight: Spacing.md,
  },
  gradient: {
    flex: 1,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
  },
  textSection: {
    flex: 2,
    justifyContent: 'center',
  },
  merchantName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  discountText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 2,
    letterSpacing: -0.5,
  },
  codeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  codeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ctaBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  ctaText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  iconSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }],
  },
  circle1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    left: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
