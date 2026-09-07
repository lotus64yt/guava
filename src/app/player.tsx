import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import { ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlayerScreen() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const videoSource = uri ? { uri: decodeURIComponent(uri) } : null;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
  });

  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Fichier introuvable.</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 p-2 bg-zinc-800 rounded"
        >
          <Text className="text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />

      <View
        className="absolute top-0 left-0 right-0 z-10 flex-row items-center p-4 bg-black/40"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          className="w-10 h-10 items-center justify-center rounded-full bg-black/40 mr-4"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
          {title || "Lecture en cours"}
        </Text>
      </View>

      <VideoView
        player={player}
        style={{ flex: 1 }}
        allowsPictureInPicture
        startsPictureInPictureAutomatically
      />
    </View>
  );
}
