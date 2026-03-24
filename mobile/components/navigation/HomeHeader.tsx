import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface HomeHeaderProps {
  user: {
    name?: string;
    locationName?: string;
  } | null;
  unreadCount: number;
  isUpdatingLocation: boolean;
  onLocationPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
}

export function HomeHeader({
  user,
  unreadCount,
  isUpdatingLocation,
  onLocationPress,
  onNotificationsPress,
  onProfilePress,
}: HomeHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <BlurView intensity={80} tint="light" style={styles.container}>
      <View style={styles.content}>
        {/* Left: Profile & Greeting */}
        <View style={styles.leftSection}>
          <Pressable onPress={onProfilePress} style={styles.profileBtn}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
          </Pressable>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name?.split(' ')[0] || 'there'}! 👋
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightSection}>
          <Pressable style={styles.locationBubble} onPress={onLocationPress}>
            {isUpdatingLocation ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="location" size={16} color={Colors.primary} />
            )}
            <Text style={styles.locationValue} numberOfLines={1}>
              {user?.locationName || 'Set Location'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
          </Pressable>

          <Pressable style={styles.notificationBtn} onPress={onNotificationsPress}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 4, // SafeArea is handled by the parent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    height: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileBtn: {
    marginRight: Spacing.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,0,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  locationValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 4,
    flexShrink: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
});
