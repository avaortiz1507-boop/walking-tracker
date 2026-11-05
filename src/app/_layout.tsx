import { DarkTheme, DefaultTheme, ThemeProvider, router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

// Reads a deep link URL, finds the walk ID at the end of it, and opens the
// Walk Details screen for that walk. Example: walkingtracker://walk/2
function handleDeepLink(url: string) {
  //splits the URL into its components and extracts the path
  //for example, walkingtracker://walk/2 will have path "walk/2"
  const { path } = Linking.parse(url);
  //matches the path against the pattern "walk/{id}" to extract the walk ID
  const match = path?.match(/^walk\/(.+)$/);
  //if the path matches the pattern, match[1] will contain the walk ID
  if (match) {
    router.push(`/walk/${match[1]}`);
  }
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Fires when a deep link arrives while the app is already running.
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received while running:", event.url);
      handleDeepLink(event.url);
    });

    // Fires once at startup: non-null if a deep link launched the app.
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App was opened by deep link:", url);
        handleDeepLink(url);
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
