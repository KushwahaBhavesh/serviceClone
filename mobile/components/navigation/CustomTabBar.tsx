import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const containerWidth = width - 32;
  const pillPadding = 8;
  const availableWidth = containerWidth - (pillPadding * 2);

  // Calculate dynamic widths based on flex ratios
  const activeFlex = 1.6;
  const inactiveFlex = 1;
  const totalFlex = activeFlex + (state.routes.length - 1) * inactiveFlex;

  const getTabWidth = (index: number) => {
    const flex = index === state.index ? activeFlex : inactiveFlex;
    return (flex / totalFlex) * availableWidth;
  };

  const getTabOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getTabWidth(i);
    }
    return offset;
  };

  const [layouts, setLayouts] = React.useState<Record<number, number>>({});
  const indicatorWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  React.useEffect(() => {
    const layout = layouts[state.index];
    if (layout) {
      const currentTabWidth = getTabWidth(state.index);
      const paddedWidth = layout + 28;
      indicatorWidth.value = withTiming(paddedWidth, { duration: 250 });

      // Calculate X based on the sum of previous dynamic widths
      const tabOffset = getTabOffset(state.index);
      const targetX = tabOffset + (currentTabWidth - paddedWidth) / 2;

      const clampedX = Math.max(0, Math.min(availableWidth - paddedWidth, targetX));
      indicatorX.value = withTiming(clampedX, { duration: 250 });
    }
  }, [state.index, layouts, availableWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: indicatorWidth.value,
      transform: [{ translateX: indicatorX.value }],
    };
  });

  return (
    <View style={[styles.container, { bottom: insets.bottom }]}>
      <BlurView
        intensity={100}
        tint="light"
        style={styles.pill}
      >
        {/* Animated Background Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            animatedStyle,
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabItem,
                { flex: isFocused ? activeFlex : inactiveFlex }
              ]}
              activeOpacity={0.7}
            >
              <TabIcon
                icon={options.tabBarIcon}
                isFocused={isFocused}
                label={typeof label === 'string' ? label : ''}
                onLayout={(w) => setLayouts(prev => ({ ...prev, [index]: w }))}
              />
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

function TabIcon({ icon, isFocused, label, onLayout }: { icon: any, isFocused: boolean, label: string, onLayout: (w: number) => void }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.05 : 1, { damping: 12, stiffness: 100 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      onLayout={(e) => onLayout(e.nativeEvent.layout.width)}
      style={[styles.tabContent, animatedIconStyle]}
    >
      <View style={styles.iconContainer}>
        {icon && icon({
          focused: isFocused,
          color: isFocused ? '#FFFFFF' : '#94A3B8',
          size: 20,
          strokeWidth: isFocused ? 3 : 2,
        })}
      </View>
      {isFocused && (
        <Text
          style={styles.label}
          numberOfLines={1}
        >
          {label.toUpperCase()}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 32,
    padding: 6,
    height: 68,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    zIndex: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
