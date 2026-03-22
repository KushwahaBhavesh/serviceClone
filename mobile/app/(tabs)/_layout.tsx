import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    Home,
    Compass,
    Calendar,
    MessageCircle,
    User,
} from 'lucide-react-native';

import { Colors } from '../../constants/theme';

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: [
                    styles.tabBar,
                    {
                        height: 68 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 14,
                    },
                ],
                tabBarLabelStyle: styles.tabLabel,
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
                    )
                ),
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Calendar size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <MessageCircle size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        borderTopWidth: 0,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : undefined,
        paddingTop: 10,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
    },
    tabBarAndroid: {
        backgroundColor: '#FFFFFFFA',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    activeIconWrap: {
        backgroundColor: Colors.primary + '12',
        borderRadius: 10,
        padding: 6,
        marginBottom: -2,
    },
});
