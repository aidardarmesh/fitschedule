import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';

import { AppProvider, useApp } from '@/context/AppContext';

// Suppress the reduced motion warning in development
LogBox.ignoreLogs(['[Reanimated] Reduced motion setting is enabled on this device.']);

function RootLayoutNav() {
  const { data, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const needsOnboarding = !data.profile.onboardingComplete;

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      router.replace('/');
    }
  }, [isLoading, data.profile.onboardingComplete, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      {/* Override device's reduced motion setting to ensure smooth animations */}
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <RootLayoutNav />
    </AppProvider>
  );
}
