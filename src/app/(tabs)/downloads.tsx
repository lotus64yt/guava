import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library/legacy";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import {
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  MoreVertical,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  RefreshControl,
  TouchableWithoutFeedback,
} from "react-native";
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<LocalVideo | null>(null);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  }, []);

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
    setSelectedVideo(null);
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

  const handleSaveToGallery = async (video: LocalVideo) => {
    setSelectedVideo(null);
    try {
      // Demande uniquement l'accès en écriture pour éviter le sélecteur de photos sur Android 13/14
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === "granted") {
        // Copier le fichier dans le cache avec la bonne extension (requise par MediaLibrary)
        const fileExt = video.name.split('.').pop() || 'mp4';
        const tempUri = `${FileSystem.cacheDirectory}${video.id}_temp.${fileExt}`;
        
        await FileSystem.copyAsync({ from: video.uri, to: tempUri });
        await MediaLibrary.saveToLibraryAsync(tempUri);
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        
        Alert.alert("Succès", `"${video.name}" a été enregistré dans le dossier Vidéos de votre téléphone.`);
      } else {
        Alert.alert("Permission refusée", "L'accès en écriture est nécessaire pour enregistrer le fichier.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'enregistrer le fichier.");
    }
  };

  const handlePlayVideo = (video: LocalVideo) => {
    setSelectedVideo(null);
    router.push({
      pathname: "/player",
      params: { uri: video.uri, title: video.name, filmId: video.id },
    });
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
        >
          <View className="my-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-white mb-2">
                Téléchargements
              </Text>
              <Text className="text-zinc-400 text-base">
                Vos vidéos stockées localement. (Appui long pour les options)
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
                  onPress={() => handlePlayVideo(video)}
                  onLongPress={() => setSelectedVideo(video)}
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
                      Fichier Local • Appui long pour options
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedVideo(video)}
                    className="p-3 bg-zinc-800 rounded-full ml-2"
                  >
                    <MoreVertical size={20} color="#a1a1aa" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Custom Bottom Sheet Modal for Video Options */}
        <Modal
          visible={!!selectedVideo}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedVideo(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedVideo(null)}>
            <View className="flex-1 bg-black/70 justify-end">
              <TouchableWithoutFeedback onPress={() => {}}>
                <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6">
                  {/* Top Header */}
                  <View className="flex-row items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-white font-bold text-lg"
                        numberOfLines={1}
                      >
                        {selectedVideo?.name}
                      </Text>
                      <Text className="text-zinc-400 text-xs mt-0.5">
                        Options de la vidéo
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setSelectedVideo(null)}
                      className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
                    >
                      <X size={18} color="#a1a1aa" />
                    </Pressable>
                  </View>

                  {/* Actions List */}
                  <View className="space-y-3">
                    <Pressable
                      onPress={() => selectedVideo && handlePlayVideo(selectedVideo)}
                      className="flex-row items-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                    >
                      <View className="w-10 h-10 rounded-lg bg-emerald-500/20 items-center justify-center mr-4">
                        <Play size={20} color="#10b981" fill="#10b981" />
                      </View>
                      <Text className="text-emerald-400 font-semibold text-base">
                        Lire la vidéo
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => selectedVideo && handleSaveToGallery(selectedVideo)}
                      className="flex-row items-center p-4 bg-zinc-800/80 border border-zinc-700/50 rounded-xl"
                    >
                      <View className="w-10 h-10 rounded-lg bg-blue-500/20 items-center justify-center mr-4">
                        <ImageIcon size={20} color="#60a5fa" />
                      </View>
                      <View>
                        <Text className="text-white font-semibold text-base">
                          Enregistrer dans la Galerie
                        </Text>
                        <Text className="text-zinc-400 text-xs mt-0.5">
                          Disponible directement dans vos Photos
                        </Text>
                      </View>
                    </Pressable>



                    <Pressable
                      onPress={() => selectedVideo && handleDelete(selectedVideo)}
                      className="flex-row items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-2"
                    >
                      <View className="w-10 h-10 rounded-lg bg-red-500/20 items-center justify-center mr-4">
                        <Trash2 size={20} color="#f87171" />
                      </View>
                      <Text className="text-red-400 font-semibold text-base">
                        Supprimer la vidéo
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}
