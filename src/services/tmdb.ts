import { Movie, SearchResult } from "@/types/tmdb";

interface Response<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

type MediaResult = Movie | SearchResult;

export function FetchNowPlayingMovies(
  page: number,
): Promise<Response<MediaResult>> {
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
