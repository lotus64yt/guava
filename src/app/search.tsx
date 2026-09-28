import { ThemedView } from "@/components/themed-view";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput, SearchSuggestionItem } from "@/components/ui/searchinput";
import { MaxContentWidth } from "@/constants/theme";
import { FetchSearch } from "@/services/tmdb";
import { Movie, SearchResult } from "@/types/tmdb";
import { Image } from "expo-image";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = params.q ? String(params.q) : "";

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [activeQuery, setActiveQuery] = useState<string>(initialQuery);
  const [searchResults, setSearchResults] = useState<
    SearchResult[] | null | false
  >(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sync initial search query parameter if router updates
  useEffect(() => {
    if (params.q !== undefined && params.q !== searchQuery) {
      setSearchQuery(String(params.q));
      setActiveQuery(String(params.q));
      setPage(1);
    }
  }, [params.q]);

  useEffect(() => {
    const fetchSearchMovies = async () => {
      if (!activeQuery || activeQuery.trim() === "") {
        setSearchResults([]);
        setTotalPages(1);
        return;
      }

      try {
        setSearchResults(null);
        const res = await FetchSearch(activeQuery, page);
        setSearchResults(res.results);
        setTotalPages(Math.min(res.total_pages || 1, 500));
      } catch (error) {
        console.error("Error fetching search results:", error);
        setSearchResults(false);
      }
    };

    fetchSearchMovies();
  }, [activeQuery, page]);

  const handleExecuteSearch = (query: string) => {
    setActiveQuery(query);
    setPage(1);
  };

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
          {/* Header */}
          <View className="my-6">
            <View className="flex-row items-center mb-4">
              <Pressable
                onPress={() => router.back()}
                className="mr-3 p-2 rounded-full bg-zinc-900 border border-white/10 active:opacity-70"
              >
                <ArrowLeft size={20} color="#ffffff" />
              </Pressable>
              <Text className="text-2xl font-bold text-white">
                Recherche
              </Text>
            </View>

            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={(query) => {
                setSearchQuery(query);
              }}
              onSubmitSearch={(query) => {
                handleExecuteSearch(query);
              }}
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
              placeholder="Rechercher un film, une série..."
            />
          </View>

          {/* Query Header */}
          {activeQuery ? (
            <Text className="text-zinc-400 text-base mb-6">
              Résultats pour <Text className="text-white font-semibold">"{activeQuery}"</Text>
            </Text>
          ) : (
            <Text className="text-zinc-400 text-base mb-6">
              Saisissez un nom de film ou de série pour démarrer la recherche.
            </Text>
          )}

          {/* Loading State */}
          {searchResults === null && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg animate-pulse">
                Recherche en cours...
              </Text>
            </View>
          )}

          {/* Error State */}
          {searchResults === false && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-red-400 text-lg">
                Erreur lors de la recherche.
              </Text>
            </View>
          )}

          {/* Empty State */}
          {searchResults && searchResults.length === 0 && activeQuery.trim() !== "" && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg">Aucun résultat trouvé.</Text>
            </View>
          )}

          {/* Movie Grid */}
          {searchResults && searchResults.length > 0 && (
            <View className="flex-row flex-wrap justify-between">
              {searchResults.map((res: any) => {
                const movie: Movie = {
                  ...res,
                  title: res.title || res.name || "Film inconnu",
                  release_date: res.release_date || res.first_air_date || "",
                };

                return (
                  <Link
                    key={res.id}
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
                        {movie.release_date ? (
                          new Date(movie.release_date).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        ) : (
                          "Date inconnue"
                        )}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )}

          {/* Pagination */}
          {searchResults && searchResults.length > 0 && totalPages > 1 && (
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
