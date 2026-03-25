import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import type { Category } from '../../lib/marketplace';

const { width } = Dimensions.get('window');
const GRID_PADDING = Spacing.lg;
const GAP = Spacing.md;
const COLUMN_WIDTH = (width - (GRID_PADDING * 2) - GAP) / 2;

interface BentoCategoryGridProps {
    categories: Category[];
    onCategoryPress: (category: Category) => void;
}

export function BentoCategoryGrid({ categories, onCategoryPress }: BentoCategoryGridProps) {
    if (!categories || categories.length === 0) return null;

    // We'll take the first 5-6 categories for the bento layout
    const mainCategories = categories.slice(0, 5);

    return (
        <View style={styles.container}>
            {/* Top Row: Balanced Visuals */}
            <View style={styles.row}>
                {mainCategories[0] && (
                    <BentoItem
                        category={mainCategories[0]}
                        onPress={onCategoryPress}
                        size="medium"
                        widthPercent={50}
                        index={0}
                    />
                )}
                {mainCategories[1] && (
                    <BentoItem
                        category={mainCategories[1]}
                        onPress={onCategoryPress}
                        size="medium"
                        widthPercent={50}
                        index={1}
                    />
                )}
            </View>

            {/* Centerpiece: The Visual Hero */}
            {mainCategories[2] && (
                <BentoItem
                    category={mainCategories[2]}
                    onPress={onCategoryPress}
                    size="large"
                    widthPercent={100}
                    index={2}
                />
            )}

            {/* Bottom Row: Balanced Visuals */}
            <View style={styles.row}>
                {mainCategories[3] && (
                    <BentoItem
                        category={mainCategories[3]}
                        onPress={onCategoryPress}
                        size="medium"
                        widthPercent={50}
                        index={3}
                    />
                )}
                {mainCategories[4] && (
                    <BentoItem
                        category={mainCategories[4]}
                        onPress={onCategoryPress}
                        size="medium"
                        widthPercent={50}
                        index={4}
                    />
                )}
            </View>
        </View>
    );
}

function BentoItem({
    category,
    onPress,
    size,
    widthPercent,
    index
}: {
    category: Category;
    onPress: (cat: Category) => void;
    size: 'large' | 'medium';
    widthPercent: number;
    index: number;
}) {
    const calcWidth = (width - (GRID_PADDING * 2) - (widthPercent === 100 ? 0 : GAP)) * (widthPercent / 100);

    const itemStyle = [
        styles.item,
        {
            width: calcWidth,
            shadowColor: '#000',
        },
        size === 'large' && styles.itemLarge,
        size === 'medium' && styles.itemMedium,
    ];

    const iconSize = size === 'large' ? 32 : 24;

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={itemStyle}
        >
            <Pressable
                style={styles.pressable}
                onPress={() => onPress(category)}
            >
                <Image 
                    source={{ uri: getCategoryImage(category.name) }} 
                    style={styles.threeDImage} 
                    resizeMode="contain" 
                />
                
                <View style={styles.glassBadge}>
                    <View style={styles.textContainer}>
                        <Text style={[
                            styles.itemText, 
                            size === 'large' && styles.itemTextLarge,
                        ]} numberOfLines={1}>
                            {category.name}
                        </Text>
                        {size === 'large' && (
                            <Text style={styles.itemSubtext}>The #1 Choice for Services</Text>
                        )}
                    </View>
                    <View style={styles.indicatorCircle}>
                        <Ionicons 
                            name="arrow-forward" 
                            size={14} 
                            color={Colors.primary} 
                        />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: GRID_PADDING,
        gap: GAP,
        marginBottom: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        gap: GAP,
    },
    item: {
        backgroundColor: '#FCFCFC',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,107,0,0.05)',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    pressable: {
        padding: 16,
        flex: 1,
        justifyContent: 'flex-end',
    },
    threeDImage: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        width: '85%',
        height: '65%',
        opacity: 1,
    },
    glassBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    textContainer: {
        flex: 1,
    },
    itemLarge: {
        height: 180,
    },
    itemMedium: {
        height: 160,
    },
    indicatorCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    itemTextLarge: {
        fontSize: 18,
    },
    itemSubtext: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
        fontWeight: '700',
    },
});

const getIconName = (name: string): any => {
    const n = name.toLowerCase();
    if (n.includes('clean')) return 'brush-outline';
    if (n.includes('repair')) return 'build-outline';
    if (n.includes('paint')) return 'color-palette-outline';
    if (n.includes('plumb')) return 'water-outline';
    if (n.includes('electr')) return 'flash-outline';
    if (n.includes('pest')) return 'bug-outline';
    return 'sparkles-outline';
};

const getIconColor = (index: number) => {
    return Colors.primary;
};

const getCategoryImage = (name: string) => {
    const n = name.toLowerCase();
    // Using high premium 3D isometric renders
    if (n.includes('clean')) return 'https://static.vecteezy.com/system/resources/previews/010/851/413/original/3d-cleaning-tools-illustration-png.png';
    if (n.includes('repair')) return 'https://static.vecteezy.com/system/resources/previews/010/851/365/original/3d-tools-toolbox-illustration-png.png';
    if (n.includes('paint')) return 'https://static.vecteezy.com/system/resources/previews/010/851/429/original/3d-paint-bucket-illustration-png.png';
    if (n.includes('plumb')) return 'https://static.vecteezy.com/system/resources/previews/011/532/521/original/3d-plumbing-tools-illustration-png.png';
    if (n.includes('electr')) return 'https://static.vecteezy.com/system/resources/previews/010/851/451/original/3d-electrician-tools-illustration-png.png';
    if (n.includes('pest')) return 'https://static.vecteezy.com/system/resources/previews/010/851/325/original/3d-pest-control-illustration-png.png';
    return 'https://static.vecteezy.com/system/resources/previews/010/851/365/original/3d-tools-toolbox-illustration-png.png';
};
