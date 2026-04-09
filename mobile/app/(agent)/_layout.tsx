import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import usePushToken from '../../hooks/usePushToken';
import RoleGuard from '../../components/shared/RoleGuard';

export default function AgentLayout() {
    usePushToken('agent');

    return (
        <RoleGuard allowedRoles={['AGENT']} requireMerchant>
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
        </RoleGuard>
    );
}
