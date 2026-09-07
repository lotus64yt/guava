import { Movie } from "@/types/tmdb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface FavoritesContextData {
  favorites: Movie[];
  toggleFavorite: (movie: Movie) => void;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextData>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem("@favorites");
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Error loading favorites", e);
      }
    };
    loadFavorites();
  }, []);

  const saveFavorites = async (newFavorites: Movie[]) => {
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem("@favorites", JSON.stringify(newFavorites));
    } catch (e) {
      console.error("Error saving favorites", e);
    }
  };

  const toggleFavorite = (movie: Movie) => {
    const exists = favorites.some((f) => f.id === movie.id);
    if (exists) {
      saveFavorites(favorites.filter((f) => f.id !== movie.id));
    } else {
      saveFavorites([...favorites, movie]);
    }
  };

  const isFavorite = (id: number) => {
    return favorites.some((f) => f.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
