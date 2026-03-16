import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function MerchantLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="analytics" options={{ title: 'Analytics', headerShown: true }} />
            <Stack.Screen name="promotions" options={{ title: 'Promotions', headerShown: true }} />
            <Stack.Screen name="schedule" options={{ title: 'Schedule', headerShown: true }} />
            <Stack.Screen name="verification" options={{ title: 'Verification', headerShown: true }} />
            <Stack.Screen name="earnings" options={{ title: 'Earnings', headerShown: true }} />
            <Stack.Screen name="reviews" options={{ title: 'Reviews', headerShown: true }} />
        </Stack>
    );
}
