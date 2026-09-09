import { useDownloads } from "@/context/DownloadContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Movie } from "@/types/tmdb";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Download,
  Heart,
  Play,
  Star,
  XCircle,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FilmDetails() {
  const { movie } = useLocalSearchParams<{ movie?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { startDownload, cancelDownload, getDownloadState, getLocalVideoUri } = useDownloads();

  const film: Movie | null = movie
    ? (JSON.parse(decodeURIComponent(movie)) as Movie)
    : null;

  if (!film) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Text className="text-white text-lg">Aucun film trouvé.</Text>
        <Pressable
          className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const downloadState = getDownloadState(film.id);
  const localUri = getLocalVideoUri(film.id);

  const handlePressDownload = () => {
    if (downloadState.status === "completed" && localUri) {
      router.push({
        pathname: "/player",
        params: {
          uri: localUri,
          title: film.title,
        },
      });
    } else if (
      downloadState.status === "initialization" ||
      downloadState.status === "downloading"
    ) {
      cancelDownload(film.id);
    } else {
      startDownload(film.id, film.title);
    }
  };

  const formattedDate = new Date(film.release_date).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack.Screen options={{ presentation: "modal" }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full h-72 bg-zinc-900 relative">
          {film.backdrop_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w780${film.backdrop_path}`,
              }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-zinc-600">Pas d'image de fond</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            pointerEvents="none"
          />
        </View>

        <View className="px-5 -mt-20">
          <View className="flex-row items-end">
            <View className="w-32 aspect-[2/3] rounded-xl overflow-hidden border-2 border-zinc-950 shadow-2xl bg-zinc-900">
              {film.poster_path ? (
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w500${film.poster_path}`,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-zinc-600 text-xs">Pas d'affiche</Text>
                </View>
              )}
            </View>

            <View className="flex-1 ml-4 mb-2">
              <Text
                className="text-2xl font-bold text-white mb-2"
                numberOfLines={2}
              >
                {film.title}
              </Text>

              <View className="flex-row items-center mb-1">
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-zinc-300 ml-1.5 font-semibold text-sm">
                  {film.vote_average ? film.vote_average.toFixed(1) : "NR"}
                  <Text className="text-zinc-500 font-normal"> / 10</Text>
                </Text>
              </View>

              <View className="flex-row items-center">
                <Calendar size={16} color="#a1a1aa" />
                <Text
                  className="text-zinc-400 ml-1.5 text-sm"
                  numberOfLines={1}
                >
                  {formattedDate !== "Invalid Date"
                    ? formattedDate
                    : "Date inconnue"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6 mb-8 space-y-3">
            <Pressable
              className={`w-full rounded-xl overflow-hidden relative border border-zinc-800 ${
                downloadState.status === "completed"
                  ? "bg-emerald-500"
                  : downloadState.status === "idle" || downloadState.status === "error"
                  ? "bg-white"
                  : "bg-zinc-900"
              }`}
              onPress={handlePressDownload}
            >
              {(downloadState.status === "initialization" ||
                downloadState.status === "downloading") && (
                <View
                  className="absolute top-0 bottom-0 left-0 bg-emerald-500/80"
                  style={{
                    width:
                      downloadState.status === "initialization"
                        ? "0%"
                        : `${downloadState.progress}%`,
                  }}
                />
              )}

              <View className="py-3.5 px-4 flex-row items-center justify-center space-x-2 z-10">
                {downloadState.status === "completed" ? (
                  <Play size={20} color="white" fill="white" />
                ) : downloadState.status === "initialization" ||
                  downloadState.status === "downloading" ? (
                  <XCircle size={20} color="white" />
                ) : (
                  <Download
                    size={20}
                    color={
                      downloadState.status === "idle" ||
                      downloadState.status === "error"
                        ? "black"
                        : "white"
                    }
                  />
                )}
                <View className="flex-col items-center ml-2">
                  <Text
                    className={`font-semibold text-base ${
                      downloadState.status === "completed"
                        ? "text-white"
                        : downloadState.status === "idle" || downloadState.status === "error"
                        ? "text-black"
                        : "text-white"
                    }`}
                  >
                    {downloadState.status === "idle" && "Télécharger"}
                    {downloadState.status === "initialization" &&
                      "Initialisation..."}
                    {downloadState.status === "downloading" &&
                      `Téléchargement ${downloadState.progress}%`}
                    {downloadState.status === "completed" && "Lire la vidéo"}
                    {downloadState.status === "error" && "Réessayer"}
                  </Text>
                  {(downloadState.status === "initialization" ||
                    downloadState.status === "downloading") && (
                    <Text className="text-xs text-zinc-300 font-normal mt-0.5">
                      {downloadState.message}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>

            <Pressable
              className="w-full mt-3 flex-row bg-zinc-800 py-3.5 rounded-xl items-center justify-center border border-zinc-700 space-x-2"
              onPress={() => toggleFavorite(film)}
            >
              <Heart
                size={20}
                color={isFavorite(film.id) ? "#ef4444" : "white"}
                fill={isFavorite(film.id) ? "#ef4444" : "transparent"}
              />
              <Text className="text-white font-semibold text-base ml-2">
                Favoris
              </Text>
            </Pressable>
          </View>

          <View className="mb-10">
            <Text className="text-xl font-bold text-white mb-3">Synopsis</Text>
            {film.overview ? (
              <Text className="text-zinc-300 text-base leading-relaxed">
                {film.overview}
              </Text>
            ) : (
              <Text className="text-zinc-500 text-base italic">
                Aucun synopsis disponible pour ce film.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable
        className="absolute w-11 h-11 rounded-full items-center justify-center bg-black/40 backdrop-blur-md"
        style={{ top: Math.max(insets.top, 16) + 8, left: 16 }}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="white" />
      </Pressable>
    </View>
  );
}
