import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import usePushToken from '../../hooks/usePushToken';

export default function CustomerLayout() {
    usePushToken('customer');

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
            }}
        />
    );
}
