import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import { useFavorites } from "@/context/FavoritesContext";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const { favorites } = useFavorites();

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
        >
          <View className="my-6">
            <Text className="text-3xl font-bold text-white mb-2">Mes Favoris</Text>
            <Text className="text-zinc-400 text-base">
              Retrouvez ici tous les films que vous avez aimés.
            </Text>
          </View>

          {favorites.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-zinc-400 text-lg">
                Vous n'avez pas encore de favoris.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {favorites.map((movie) => (
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
                      {new Date(movie.release_date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
