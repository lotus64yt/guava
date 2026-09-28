import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { Platform, Pressable, Text, View, LayoutChangeEvent, GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const { uri, title, filmId } = useLocalSearchParams<{ uri: string; title: string; filmId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [resolvedVideoUri, setResolvedVideoUri] = useState<string>("");
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [scrubbingTime, setScrubbingTime] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredTimestamp = useRef(false);
  const lastThumbnailTime = useRef<number>(0);
  const isGeneratingThumb = useRef(false);

  const generateThumbnail = async (targetTime: number, playerInst: any) => {
    if (isGeneratingThumb.current || !playerInst) return;
    if (Math.abs(lastThumbnailTime.current - targetTime) < 5) return;
    isGeneratingThumb.current = true;
    try {
      const thumbs = await playerInst.generateThumbnailsAsync([targetTime]);
      if (thumbs && thumbs.length > 0) {
        setPreviewImage(thumbs[0].image.uri);
        lastThumbnailTime.current = targetTime;
      }
    } catch (e) {}
    isGeneratingThumb.current = false;
  };

  useEffect(() => {
    let isMounted = true;
    async function prepareVideoUri() {
      if (!uri) return;
      const rawUri = decodeURIComponent(uri);

      if (Platform.OS === "android" && rawUri.startsWith("file://")) {
        try {
          const contentUri = await FileSystem.getContentUriAsync(rawUri);
          if (isMounted && contentUri) {
            setResolvedVideoUri(contentUri);
            return;
          }
        } catch (e) {}
      }

      if (isMounted) {
        setResolvedVideoUri(rawUri.startsWith("file://") ? encodeURI(rawUri) : rawUri);
      }
    }

    prepareVideoUri();
    return () => {
      isMounted = false;
    };
  }, [uri]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    if (Platform.OS === "android") {
      try {
        NavigationBar.setVisibilityAsync("hidden");
      } catch (e) {}
    }

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (Platform.OS === "android") {
        try {
          NavigationBar.setVisibilityAsync("visible");
        } catch (e) {}
      }
    };
  }, []);

  const videoSource = resolvedVideoUri ? { uri: resolvedVideoUri } : null;

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.staysActiveInBackground = true;
    p.play();
  });

  useEffect(() => {
    if (resolvedVideoUri && player) {
      try {
        player.replace({ uri: resolvedVideoUri });
        player.play();
      } catch (e) {}
    }
  }, [resolvedVideoUri]);

  useEffect(() => {
    if (!player || !filmId) return;

    let timeToRestore: number | null = null;
    let checkedStorage = false;

    AsyncStorage.getItem(`@guava_timestamp_${filmId}`).then(stored => {
      if (stored) timeToRestore = parseFloat(stored);
      checkedStorage = true;
    }).catch(() => {
      checkedStorage = true;
    });

    const interval = setInterval(() => {
      if (!player) return;

      setCurrentTime(player.currentTime);
      setDuration(player.duration);
      setIsPlaying(player.playing);

      if (checkedStorage && !hasRestoredTimestamp.current) {
        if (player.duration > 0) {
          if (timeToRestore !== null && timeToRestore > 0 && timeToRestore < player.duration - 10) {
            player.currentTime = timeToRestore;
          }
          hasRestoredTimestamp.current = true;
        } else if (player.duration === 0 || isNaN(player.duration)) {
          // Attendre que la vidéo soit prête et connaisse sa durée
        }
      }

      if (hasRestoredTimestamp.current && player.playing && player.currentTime > 5) {
        AsyncStorage.setItem(`@guava_timestamp_${filmId}`, player.currentTime.toString()).catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, filmId]);

  const triggerHideControls = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    triggerHideControls();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const togglePlayPause = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    triggerHideControls();
  };

  const handleScrubMove = (locationX: number) => {
    if (!player || duration <= 0 || progressBarWidth <= 0) return;
    triggerHideControls();
    const target = Math.max(0, Math.min((locationX / progressBarWidth) * duration, duration));
    setScrubbingTime(target);
    player.currentTime = target;
    generateThumbnail(target, player);
  };

  const skipForward = () => {
    if (player) {
      player.currentTime = Math.min(player.currentTime + 10, duration);
      triggerHideControls();
    }
  };

  const skipBackward = () => {
    if (player) {
      player.currentTime = Math.max(player.currentTime - 10, 0);
      triggerHideControls();
    }
  };

  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Fichier introuvable.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 p-2 bg-zinc-800 rounded">
          <Text className="text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View className="flex-1 bg-black relative">
      <StatusBar hidden />
      <Stack.Screen options={{ presentation: "fullScreenModal", headerShown: false }} />

      <VideoView
        player={player}
        style={{ flex: 1 }}
        nativeControls={false}
        allowsPictureInPicture
        startsPictureInPictureAutomatically
      />
      
      <Pressable 
        className="absolute top-0 bottom-0 left-0 right-0 z-10" 
        onPress={() => {
          if (showControls) {
            setShowControls(false);
          } else {
            triggerHideControls();
          }
        }} 
      />

      {showControls && (
        <View className="absolute top-0 left-0 right-0 bottom-0" pointerEvents="box-none">
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "transparent"]}
            className="absolute top-0 left-0 right-0 h-24"
            pointerEvents="none"
          />
          <View className="absolute top-4 left-4 z-30 flex-row items-center px-2 py-2 w-full" style={{ marginTop: insets.top }}>
            <Pressable className="w-10 h-10 items-center justify-center mr-2 rounded-full bg-black/40" onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg flex-1 pr-16 shadow-sm shadow-black" numberOfLines={1}>
              {title || "Lecture vidéo"}
            </Text>
          </View>

          <View className="absolute top-0 bottom-0 left-0 right-0 items-center justify-center flex-row space-x-12 z-30" pointerEvents="box-none">
            <Pressable onPress={skipBackward} className="w-16 h-16 rounded-full bg-black/40 items-center justify-center">
              <RotateCcw size={32} color="white" />
            </Pressable>

            <Pressable onPress={togglePlayPause} className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
              {isPlaying ? <Pause size={40} color="white" fill="white" /> : <Play size={40} color="white" fill="white" className="ml-2" />}
            </Pressable>

            <Pressable onPress={skipForward} className="w-16 h-16 rounded-full bg-black/40 items-center justify-center">
              <RotateCw size={32} color="white" />
            </Pressable>
          </View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            className="absolute bottom-0 left-0 right-0 h-32 z-20"
            pointerEvents="none"
          />
          <View className="absolute bottom-6 left-6 right-6 z-30" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="flex-row items-center justify-between mb-3 px-2">
              <Text className="text-white text-sm font-medium">{formatTime(currentTime)}</Text>
              <Text className="text-zinc-300 text-sm font-medium">{formatTime(duration)}</Text>
            </View>

            <View
              className="h-10 justify-center w-full relative group"
              onLayout={(e: LayoutChangeEvent) => setProgressBarWidth(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                handleScrubMove(e.nativeEvent.locationX);
              }}
              onResponderMove={(e) => {
                handleScrubMove(e.nativeEvent.locationX);
              }}
              onResponderRelease={() => {
                setScrubbingTime(null);
                setPreviewImage(null);
              }}
              onResponderTerminate={() => {
                setScrubbingTime(null);
                setPreviewImage(null);
              }}
            >
              <View className="w-full h-2 rounded-full bg-white/30 absolute left-0 right-0 top-4" pointerEvents="none" />
              <View className="h-2 rounded-full bg-emerald-500 absolute left-0 top-4" style={{ width: `${progressPercent}%` }} pointerEvents="none" />
              <View
                className="w-4 h-4 rounded-full bg-white absolute top-3 shadow shadow-black"
                style={{ left: `${Math.max(0, Math.min(progressPercent, 99))}%`, marginLeft: -8 }}
                pointerEvents="none"
              />
            </View>
          </View>

          {/* Thumbnail Preview */}
          {scrubbingTime !== null && previewImage && (
            <View 
              className="absolute bottom-24 items-center z-50 pointer-events-none" 
              style={{ left: `${Math.max(10, Math.min((scrubbingTime / duration) * 100, 90))}%`, marginLeft: -60 }}
            >
              <View className="w-[120px] h-[68px] bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
                <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              <Text className="text-white text-xs font-semibold mt-1 shadow-sm shadow-black bg-black/60 px-2 py-0.5 rounded-full">{formatTime(scrubbingTime)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
