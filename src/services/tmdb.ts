import { Movie, SearchResult } from "@/types/tmdb";

interface Response<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

type MediaResult = Movie | SearchResult;

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export function FetchNowPlayingMovies(
  page: number,
): Promise<Response<MediaResult>> {
  return fetch(
    `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&page=${page}`,
  ).then((response) => response.json());
}

export function FetchSearch(
  query: string,
  page: number = 1,
): Promise<Response<SearchResult>> {
  return fetch(
    `https://api.themoviedb.org/3/search/multi?language=fr-FR&api_key=${TMDB_API_KEY}&query=${query}&page=${page}`,
  ).then((response) => response.json());
}

export function FetchTVShowDetails(tv_id: number): Promise<any> {
  return fetch(
    `https://api.themoviedb.org/3/tv/${tv_id}?language=fr-FR&api_key=${TMDB_API_KEY}`,
  ).then((response) => response.json());
}

export function FetchTVSeasonDetails(
  tv_id: number,
  season_number: number,
): Promise<any> {
  return fetch(
    `https://api.themoviedb.org/3/tv/${tv_id}/season/${season_number}?language=fr-FR&api_key=${TMDB_API_KEY}`,
  ).then((response) => response.json());
}
