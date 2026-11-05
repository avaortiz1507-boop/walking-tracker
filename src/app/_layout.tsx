import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Fires when a deep link arrives while the app is already running.
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received while running:", event.url);
    });

    // Fires once at startup: non-null if a deep link launched the app.
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App was opened by deep link:", url);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
