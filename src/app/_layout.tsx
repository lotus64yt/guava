import "../global.css";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { DownloadProvider } from "@/context/DownloadContext";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <DownloadProvider>
      <FavoritesProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }} />
          <AnimatedSplashOverlay />
        </ThemeProvider>
      </FavoritesProvider>
    </DownloadProvider>
  );
}
