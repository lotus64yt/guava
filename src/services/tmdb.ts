import { Movie, SearchResult } from "@/types/tmdb";

interface Response<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export function FetchDiscoverMovies(page: number): Promise<Response<Movie>> {
  return fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&page=${page}`,
  ).then((response) => response.json());
}

export function FetchNowPlayingMovies(page: number): Promise<Response<Movie>> {
  return fetch(
    `https://api.themoviedb.org/3/trending/all/day?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&page=${page}`,
  ).then((response) => response.json());
}

export function FetchSearch(
  query: string,
  page: number = 1,
): Promise<Response<SearchResult>> {
  return fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&query=${query}&page=${page}`,
  ).then((response) => response.json());
}
