import { Movie } from "@/types/tmdb";

interface DiscoverMoviesResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export function FetchDiscoverMovies(
  page: number,
): Promise<DiscoverMoviesResponse> {
  return fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&page=${page}`,
  ).then((response) => response.json());
}

export function FetchNowPlayingMovies(
  page: number,
): Promise<DiscoverMoviesResponse> {
  return fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&page=${page}`,
  ).then((response) => response.json());
}
