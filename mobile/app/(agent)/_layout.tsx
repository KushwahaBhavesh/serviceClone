import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AgentLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: true }} />
            <Stack.Screen name="support" options={{ title: 'Support', headerShown: true }} />
        </Stack>
    );
}
