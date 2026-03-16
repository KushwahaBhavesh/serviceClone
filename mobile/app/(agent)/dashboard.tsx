import { Redirect } from 'expo-router';

export default function RedirectToTabs() {
    return <Redirect href="/(agent)/(tabs)/dashboard" />;
}
