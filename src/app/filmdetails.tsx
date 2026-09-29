import { useDownloads } from "@/context/DownloadContext";
import { useFavorites } from "@/context/FavoritesContext";
import { GetVidzyLink } from "@/services/fs";
import { FetchTVShowDetails, FetchTVSeasonDetails } from "@/services/tmdb";
import { Movie, TVShowDetails, TVSeasonDetails, TVSeason, TVEpisode } from "@/types/tmdb";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Download,
  Heart,
  Play,
  Star,
  XCircle,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FilmDetails() {
  const { movie } = useLocalSearchParams<{ movie?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { startDownload, cancelDownload, getDownloadState, getLocalVideoUri } = useDownloads();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [tvDetails, setTvDetails] = useState<TVShowDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<TVSeasonDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [loadingTv, setLoadingTv] = useState(false);

  const film: Movie | null = movie
    ? (JSON.parse(decodeURIComponent(movie)) as Movie)
    : null;
    
  const isTv = film?.media_type === "tv";
  const displayTitle = film?.title || film?.name || "Titre inconnu";
  const displayDate = film?.release_date || film?.first_air_date;

  useEffect(() => {
    if (isTv && film) {
      setLoadingTv(true);
      FetchTVShowDetails(film.id).then(details => {
         setTvDetails(details);
         if (details.seasons && details.seasons.length > 0) {
             const firstValidSeason = details.seasons.find((s: TVSeason) => s.season_number > 0) || details.seasons[0];
             setSelectedSeason(firstValidSeason.season_number);
         }
      }).catch(console.error).finally(() => setLoadingTv(false));
    }
  }, [isTv]);

  useEffect(() => {
    if (isTv && film && selectedSeason !== null) {
      FetchTVSeasonDetails(film.id, selectedSeason).then(details => {
         setSeasonDetails(details);
         if (details.episodes && details.episodes.length > 0) {
             setSelectedEpisode(details.episodes[0].episode_number);
         }
      }).catch(console.error);
    }
  }, [selectedSeason, isTv]);

  if (!film) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <Text className="text-white text-lg">Aucun film/série trouvé.</Text>
        <Pressable className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg" onPress={() => router.back()}>
          <Text className="text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const compositeId = isTv ? Number(`${film.id}${String(selectedSeason).padStart(2, '0')}${String(selectedEpisode).padStart(3, '0')}`) : film.id;
  const targetTitle = isTv ? `${displayTitle} S${String(selectedSeason).padStart(2, '0')}E${String(selectedEpisode).padStart(2, '0')}` : displayTitle;

  const downloadState = getDownloadState(compositeId);
  const localUri = getLocalVideoUri(compositeId);

  const handlePressDownload = () => {
    if (downloadState.status === "completed" && localUri) {
      router.push({
        pathname: "/player",
        params: { uri: localUri, title: targetTitle, filmId: compositeId.toString() },
      });
    } else if (downloadState.status === "initialization" || downloadState.status === "downloading") {
      cancelDownload(compositeId);
    } else {
      startDownload(compositeId, targetTitle);
    }
  };


  const handleStreamVideo = async () => {
    setShowDropdown(false);
    setIsStreaming(true);
    try {
      const url = isTv 
         ? await GetVidzyLink(displayTitle, undefined, selectedSeason, selectedEpisode) 
         : await GetVidzyLink(displayTitle);
         
      setIsStreaming(false);
      if (url) {
        router.push({
          pathname: "/player",
          params: { uri: url, title: targetTitle, filmId: compositeId.toString() },
        });
      } else {
        Alert.alert("Erreur", "Impossible de trouver un lien pour cette vidéo.");
      }
    } catch (e) {
      setIsStreaming(false);
      Alert.alert("Erreur", "Une erreur est survenue lors de la récupération.");
    }
  };

  const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "Date inconnue";

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack.Screen options={{ presentation: "modal" }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full h-72 bg-zinc-900 relative">
          {film.backdrop_path ? (
            <Image source={{ uri: `https://image.tmdb.org/t/p/w780${film.backdrop_path}` }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center"><Text className="text-zinc-600">Pas d'image de fond</Text></View>
          )}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />
        </View>

        <View className="px-5 -mt-20">
          <View className="flex-row items-end">
            <View className="w-32 aspect-[2/3] rounded-xl overflow-hidden border-2 border-zinc-950 shadow-2xl bg-zinc-900">
              {film.poster_path ? (
                <Image source={{ uri: `https://image.tmdb.org/t/p/w500${film.poster_path}` }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center"><Text className="text-zinc-600 text-xs">Pas d'affiche</Text></View>
              )}
            </View>

            <View className="flex-1 ml-4 mb-2">
              <Text className="text-2xl font-bold text-white mb-2" numberOfLines={2}>{displayTitle}</Text>
              <View className="flex-row items-center mb-1">
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-zinc-300 ml-1.5 font-semibold text-sm">
                  {film.vote_average ? film.vote_average.toFixed(1) : "NR"}
                  <Text className="text-zinc-500 font-normal"> / 10</Text>
                </Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={16} color="#a1a1aa" />
                <Text className="text-zinc-400 ml-1.5 text-sm" numberOfLines={1}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {isTv && (
            <View className="mt-6 -mb-2 z-40 relative">
               {loadingTv ? (
                  <Text className="text-zinc-400 text-sm">Chargement des saisons...</Text>
               ) : tvDetails?.seasons && tvDetails.seasons.length > 0 ? (
                  <View>
                     <Text className="text-white font-bold text-lg mb-2">Saisons</Text>
                     <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {tvDetails.seasons.filter(s => s.season_number > 0).map(s => (
                           <Pressable 
                              key={s.id} 
                              onPress={() => setSelectedSeason(s.season_number)}
                              className={`mr-3 px-4 py-2 rounded-full border ${selectedSeason === s.season_number ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}
                           >
                              <Text className={`font-medium ${selectedSeason === s.season_number ? 'text-white' : 'text-zinc-300'}`}>Saison {s.season_number}</Text>
                           </Pressable>
                        ))}
                     </ScrollView>
                     
                     <Text className="text-white font-bold text-lg mb-2">Épisodes</Text>
                     {seasonDetails?.episodes ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                           {seasonDetails.episodes.map(e => (
                              <Pressable 
                                 key={e.id} 
                                 onPress={() => setSelectedEpisode(e.episode_number)}
                                 className={`mr-3 px-4 py-2 rounded-full border ${selectedEpisode === e.episode_number ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}
                              >
                                 <Text className={`font-medium ${selectedEpisode === e.episode_number ? 'text-white' : 'text-zinc-300'}`}>Ép {e.episode_number}</Text>
                              </Pressable>
                           ))}
                        </ScrollView>
                     ) : (
                        <Text className="text-zinc-500 text-sm mb-4">Chargement des épisodes...</Text>
                     )}
                  </View>
               ) : (
                  <Text className="text-zinc-500 text-sm">Aucune saison trouvée.</Text>
               )}
            </View>
          )}

          <View className="mt-6 mb-8 space-y-3 z-50 relative">
            <View className="w-full relative z-50">
              <View className={`w-full rounded-xl flex-row overflow-hidden border border-zinc-800 ${
                downloadState.status === "completed"
                  ? "bg-emerald-500"
                  : downloadState.status === "idle" || downloadState.status === "error"
                  ? "bg-white"
                  : "bg-zinc-900"
              }`}>
                <Pressable className="flex-1 relative justify-center" onPress={handlePressDownload}>
                  {(downloadState.status === "initialization" || downloadState.status === "downloading") && (
                    <View className="absolute top-0 bottom-0 left-0 bg-emerald-500/80" style={{ width: downloadState.status === "initialization" ? "0%" : `${downloadState.progress}%` }} />
                  )}
                  <View className="py-3.5 px-4 flex-row items-center justify-center space-x-2 z-10">
                    {downloadState.status === "completed" ? (
                      <Play size={20} color="white" fill="white" />
                    ) : downloadState.status === "initialization" || downloadState.status === "downloading" ? (
                      <XCircle size={20} color="white" />
                    ) : (
                      <Download size={20} color={downloadState.status === "idle" || downloadState.status === "error" ? "black" : "white"} />
                    )}
                    <View className="flex-col items-center ml-2">
                      <Text className={`font-semibold text-base ${downloadState.status === "completed" ? "text-white" : downloadState.status === "idle" || downloadState.status === "error" ? "text-black" : "text-white"}`}>
                        {downloadState.status === "idle" && "Télécharger"}
                        {downloadState.status === "initialization" && "Initialisation..."}
                        {downloadState.status === "downloading" && `Téléchargement ${downloadState.progress}%`}
                        {downloadState.status === "completed" && "Lire la vidéo"}
                        {downloadState.status === "error" && "Réessayer"}
                      </Text>
                      {(downloadState.status === "initialization" || downloadState.status === "downloading") && (
                        <Text className="text-xs text-zinc-300 font-normal mt-0.5">{downloadState.message}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>

                <View className={`w-[1px] ${downloadState.status === "completed" ? "bg-emerald-600" : downloadState.status === "idle" || downloadState.status === "error" ? "bg-gray-300" : "bg-zinc-800"}`} />

                <Pressable className="w-14 items-center justify-center z-10" onPress={() => setShowDropdown(!showDropdown)}>
                  <ChevronDown size={20} color={downloadState.status === "idle" || downloadState.status === "error" ? "black" : "white"} />
                </Pressable>
              </View>

              {showDropdown && (
                <View className="absolute top-[110%] right-0 w-48 bg-zinc-800 rounded-xl border border-zinc-700 shadow-xl overflow-hidden z-50" style={{ elevation: 5 }}>
                  <Pressable className="p-4 flex-row items-center" onPress={handleStreamVideo} disabled={isStreaming}>
                    {isStreaming ? (
                      <Text className="text-white font-medium ml-2">Chargement...</Text>
                    ) : (
                      <>
                        <Play size={18} color="white" fill="white" />
                        <Text className="text-white font-medium ml-2">Streamer la vidéo</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>

            <Pressable className="w-full mt-3 flex-row bg-zinc-800 py-3.5 rounded-xl items-center justify-center border border-zinc-700 space-x-2" onPress={() => toggleFavorite(film)}>
              <Heart size={20} color={isFavorite(film.id) ? "#ef4444" : "white"} fill={isFavorite(film.id) ? "#ef4444" : "transparent"} />
              <Text className="text-white font-semibold text-base ml-2">Favoris</Text>
            </Pressable>
          </View>

          <View className="mb-10">
            <Text className="text-xl font-bold text-white mb-3">Synopsis</Text>
            {film.overview ? (
              <Text className="text-zinc-300 text-base leading-relaxed">{film.overview}</Text>
            ) : (
              <Text className="text-zinc-500 text-base italic">Aucun synopsis disponible pour ce contenu.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable className="absolute w-11 h-11 rounded-full items-center justify-center bg-black/40 backdrop-blur-md" style={{ top: Math.max(insets.top, 16) + 8, left: 16 }} onPress={() => router.back()}>
        <ArrowLeft size={24} color="white" />
      </Pressable>
    </View>
  );
}
