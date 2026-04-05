import { Stack } from 'expo-router';

export default function MerchantLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8FAFC' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="promotions" />
            <Stack.Screen name="schedule" />
            <Stack.Screen name="verification" />
            <Stack.Screen name="earnings" />
            <Stack.Screen name="reviews" />
            <Stack.Screen name="profile-edit" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="agents" />
            <Stack.Screen name="agents/map" />
            <Stack.Screen name="orders/[id]" />
            <Stack.Screen name="add-service" />
            <Stack.Screen name="chat/[id]" />
        </Stack>
    );
}
