import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { FileVideo, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useVideoPlayer, VideoView } from "expo-video";

const STORAGE_KEY = "@guava_imported_videos";

interface LocalVideo {
  id: string;
  name: string;
  uri: string;
}

function VideoThumbnailPreview({ uri }: { uri: string }) {
  const [error, setError] = useState(false);
  const player = useVideoPlayer(uri ? { uri } : null, (player) => {
    player.muted = true;
    player.pause();
  });

  if (error) {
    return <FileVideo size={24} color="#a1a1aa" />;
  }

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

export default function DownloadsScreen() {
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVideos(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const saveVideos = async (newVideos: LocalVideo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newVideos));
      setVideos(newVideos);
    } catch (error) {
      console.error("Error saving videos:", error);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];

        Alert.alert(
          "Ajouter à la bibliothèque",
          `Voulez-vous ajouter "${file.name}" à votre bibliothèque Guava ?`,
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Ajouter",
              onPress: async () => {
                const newVideo: LocalVideo = {
                  id: Date.now().toString(),
                  name: file.name,
                  uri: file.uri,
                };
                const updated = [newVideo, ...videos];
                await saveVideos(updated);
                Alert.alert("Succès", "La vidéo a été ajoutée !");
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleDelete = (video: LocalVideo) => {
    Alert.alert(
      "Supprimer la vidéo",
      `Êtes-vous sûr de vouloir retirer "${video.name}" de votre bibliothèque ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const updated = videos.filter((v) => v.id !== video.id);
            await saveVideos(updated);
          },
        },
      ],
    );
  };

  return (
    <ThemedView className="flex-1 w-full bg-zinc-950">
      <SafeAreaView
        className="flex-1 w-full self-center px-4"
        style={{ maxWidth: MaxContentWidth }}
      >
        <ScrollView
          contentContainerClassName="grow pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="my-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-white mb-2">
                Téléchargements
              </Text>
              <Text className="text-zinc-400 text-base">
                Vos vidéos stockées localement.
              </Text>
            </View>
            <Pressable
              onPress={handleImport}
              className="bg-white w-12 h-12 rounded-full items-center justify-center"
            >
              <Plus size={24} color="black" />
            </Pressable>
          </View>

          {videos.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg mb-4 text-center">
                Aucune vidéo dans votre bibliothèque.
              </Text>
              <Pressable
                onPress={handleImport}
                className="px-6 py-3 bg-zinc-800 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Importer une vidéo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4 space-y-4">
              {videos.map((video, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    router.push({
                      pathname: "/player",
                      params: {
                        uri: video.uri,
                        title: video.name,
                      },
                    });
                  }}
                  className="flex-row items-center p-4 bg-zinc-900 rounded-xl border border-white/5"
                >
                  <View className="w-16 h-12 bg-zinc-800 rounded-lg overflow-hidden items-center justify-center mr-4 relative">
                    <VideoThumbnailPreview uri={video.uri} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-semibold text-base"
                      numberOfLines={1}
                    >
                      {video.name}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-1">
                      Fichier Local
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(video)}
                    className="p-3 bg-red-500/10 rounded-full"
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
