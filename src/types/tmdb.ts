export type MovieType = "movie" | "tv";

export interface Movie {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title?: string;
  name?: string;
  original_language: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string;
  media_type: MovieType;
  genre_ids: number[];
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface SearchResult {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string;
  media_type: MovieType;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  softcore: boolean;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TVSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  vote_average: number;
}

export interface TVShowDetails extends Movie {
  seasons: TVSeason[];
  number_of_episodes: number;
  number_of_seasons: number;
}

export interface TVEpisode {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number;
  season_number: number;
  show_id: number;
  still_path: string;
  vote_average: number;
  vote_count: number;
}

export interface TVSeasonDetails {
  _id: string;
  air_date: string;
  episodes: TVEpisode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string;
  season_number: number;
}
