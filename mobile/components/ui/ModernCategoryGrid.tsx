import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence 
} from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { Category } from '../../lib/marketplace';

const { width } = Dimensions.get('window');
const CATEGORY_COLORS = ['#E3F2FD', '#FFF3E0', '#F3E5F5', '#E8F5E9', '#FCE4EC', '#FFFDE7', '#E0F2F1', '#F5F5F5'];

interface ModernCategoryGridProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
  isLoading?: boolean;
}

export function ModernCategoryGrid({ categories, onCategoryPress, isLoading }: ModernCategoryGridProps) {
  return (
    <View style={styles.grid}>
      {categories.map((cat, index) => (
        <CategoryItem
          key={cat.id}
          category={cat}
          index={index}
          onPress={onCategoryPress}
        />
      ))}
    </View>
  );
}

function CategoryItem({ category, index, onPress }: { 
  category: Category; 
  index: number; 
  onPress: (cat: Category) => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={() => onPress(category)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.card}
    >
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }
          ]}
        >
          <Ionicons name="sparkles" size={24} color={Colors.text} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  card: {
    width: (width - Spacing.lg * 2 - Spacing.md * 3) / 4,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  animatedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
