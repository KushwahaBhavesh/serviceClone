import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    LayoutGrid,
    ClipboardList,
    BookOpen,
    MessageCircle,
    Settings,
} from 'lucide-react-native';

import { Colors } from '../../../constants/theme';

export default function MerchantTabLayout() {
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
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="catalog"
                options={{
                    title: 'Catalog',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <BookOpen size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <MessageCircle size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
