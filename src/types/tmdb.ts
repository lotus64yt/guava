export interface Movie {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  title: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  softcore: boolean;
  video: boolean;
}

export type MovieType = "movie" | "tv" | "person";

export interface SearchResult {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  media_type: MovieType;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  softcore: boolean;
  video: boolean;
  vote_average: number;
  vote_count: number;
}
