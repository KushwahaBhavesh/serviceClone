import { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useAppPersistence } from '../hooks/useAppPersistence';
import useNotificationHandler from '../hooks/useNotificationHandler';
import { Colors } from '../constants/theme';
import SplashScreen from '../components/SplashScreen';
import { ToastProvider } from '../context/ToastContext';
import OfflineBanner from '../components/shared/OfflineBanner';
import SessionExpiredModal from '../components/shared/SessionExpiredModal';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user, hasVisitedOnboarding } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isInitialized) return;
    if (!navigationState?.key) return; // Wait until the navigator has mounted

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboardingGroup = rootSegment === '(onboarding)';
    const inMerchantGroup = rootSegment === '(merchant)';
    const inAgentGroup = rootSegment === '(agent)';
    const inCustomerGroup = rootSegment === '(tabs)' || rootSegment === '(customer)';
    const isIntroScreen = inOnboardingGroup && segments[1] === 'intro';

    if (!isAuthenticated) {
      if (!hasVisitedOnboarding && !isIntroScreen) {
        router.replace('/(onboarding)/intro');
      } else if (hasVisitedOnboarding && !inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else {
      // Authenticated flow
      if (!user?.onboardingCompleted) {
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)/role-select');
        }
      } else {
        // Onboarding is completed - Role Based Redirection
        if (user.role === 'MERCHANT') {
          if (!inMerchantGroup) {
            router.replace('/(merchant)/dashboard');
          }
        } else if (user.role === 'AGENT') {
          if (!inAgentGroup) {
            router.replace('/(agent)/dashboard');
          }
        } else {
          // Default to Customer
          if (!inCustomerGroup) {
            router.replace('/(tabs)/home');
          }
        }
      }
    }
  }, [isAuthenticated, isInitialized, user, segments, hasVisitedOnboarding, navigationState?.key]);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  // Prevent flash of wrong content by checking segment vs role
  if (isAuthenticated && user?.onboardingCompleted) {
    const rootSegment = segments[0];
    if (user.role === 'MERCHANT' && (rootSegment === '(tabs)' || rootSegment === '(customer)' || rootSegment === '(agent)')) {
      return null;
    }
    if (user.role === 'AGENT' && (rootSegment === '(tabs)' || rootSegment === '(customer)' || rootSegment === '(merchant)')) {
      return null;
    }
    if (user.role === 'CUSTOMER' && (rootSegment === '(merchant)' || rootSegment === '(agent)')) {
      return null;
    }
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useAppPersistence();
  useNotificationHandler();

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="dark" translucent />
        <AuthGate>
          <Slot />
        </AuthGate>
        <OfflineBanner />
        <SessionExpiredModal />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
