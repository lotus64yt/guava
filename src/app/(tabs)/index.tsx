import { ThemedView } from "@/components/themed-view";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput, SearchSuggestionItem } from "@/components/ui/searchinput";
import { MaxContentWidth } from "@/constants/theme";
import { FetchNowPlayingMovies, FetchSearch } from "@/services/tmdb";
import { Movie, SearchResult } from "@/types/tmdb";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [movies, setMovies] = useState<Movie[] | null | false>(null);
  const [searchResults, setSearchResults] = useState<
    SearchResult[] | null | false
  >(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const searchMovies = async () => {
    if (searchQuery.trim() === "") {
      return;
    }

    try {
      setSearchResults(null);
      const res = await FetchSearch(searchQuery, page);
      setSearchResults(res.results);
    } catch (error) {
      console.error("Error searching movies:", error);
      setSearchResults(false);
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setMovies(null);
        const res = await FetchNowPlayingMovies(page);
        setMovies(res.results);
        setTotalPages(Math.min(res.total_pages, 500));
      } catch (error) {
        console.error("Error fetching movies:", error);
        setMovies(false);
      }
    };
    fetchMovies();
  }, [page]);

  useEffect(() => {
    searchMovies();
  }, [searchQuery, page]);

  return (
    <ThemedView className="flex-1 w-full bg-zinc-950">
      <SafeAreaView
        className="flex-1 w-full self-center px-4"
        style={{
          maxWidth: MaxContentWidth,
        }}
      >
        <ScrollView
          contentContainerClassName="grow pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="my-6">
            <Text className="text-3xl font-bold text-white mb-2">
              À l'affiche
            </Text>
            <Text className="text-zinc-400 text-base mb-6">
              Découvrez les films actuellement au cinéma.
            </Text>
            <SearchInput
              onSearch={(query) => {
                setSearchQuery(query);
              }}
              onSubmitSearch={(query) => {
                if (query.trim()) {
                  router.push({
                    pathname: "/search" as any,
                    params: { q: query.trim() },
                  });
                }
              }}
              value={searchQuery}
              suggestions={
                Array.isArray(searchResults)
                  ? searchResults.map((res: any) => {
                      const movieObj: Movie = {
                        ...res,
                        title: res.title || res.name || "Film inconnu",
                        release_date: res.release_date || res.first_air_date || "",
                      };
                      return {
                        id: res.id,
                        title: movieObj.title,
                        poster_path: res.poster_path,
                        release_date: movieObj.release_date,
                        movieData: movieObj,
                      };
                    })
                  : []
              }
              onSelectSuggestion={(item: SearchSuggestionItem) => {
                if (item.movieData) {
                  router.push({
                    pathname: "/filmdetails",
                    params: {
                      movie: encodeURIComponent(JSON.stringify(item.movieData)),
                    },
                  });
                }
              }}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un film..."
            />
          </View>

          {movies === null && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg animate-pulse">
                Chargement des films...
              </Text>
            </View>
          )}

          {movies === false && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-red-400 text-lg">
                Erreur de chargement.
              </Text>
            </View>
          )}

          {movies && movies.length === 0 && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg">Aucun film trouvé.</Text>
            </View>
          )}

          {movies && movies.length > 0 && (
            <View className="flex-row flex-wrap justify-between">
              {movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={{
                    pathname: "/filmdetails",
                    params: {
                      movie: encodeURIComponent(JSON.stringify(movie)),
                    },
                  }}
                  asChild
                >
                  <Pressable className="w-[48%] mb-6">
                    <View className="rounded-xl overflow-hidden bg-zinc-900 border border-white/10 aspect-[2/3] mb-2 shadow-lg">
                      {movie.poster_path ? (
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                          }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                          transition={300}
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center bg-zinc-800">
                          <Text className="text-zinc-500 text-sm">
                            Pas d'affiche
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-white font-semibold text-base"
                      numberOfLines={1}
                    >
                      {movie.title}
                    </Text>
                    <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                      {new Date(movie.release_date).toLocaleDateString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}

          {movies && movies.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
