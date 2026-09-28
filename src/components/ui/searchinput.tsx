import { Movie } from "@/types/tmdb";
import { Image } from "expo-image";
import { Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export interface SearchSuggestionItem {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  movieData?: Movie;
}

interface SearchInputProps extends TextInputProps {
  onSearch: (query: string) => void;
  onSubmitSearch?: (query: string) => void;
  suggestions?: SearchSuggestionItem[];
  onSelectSuggestion?: (item: SearchSuggestionItem) => void;
  containerStyle?: object;
}

export function SearchInput({
  style,
  containerStyle,
  onSearch,
  onSubmitSearch,
  suggestions = [],
  onSelectSuggestion,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(String(value ?? ""));

  const filteredSuggestions = useMemo(
    () =>
      suggestions
        .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5),
    [suggestions, query],
  );

  const handleSubmit = () => {
    setFocused(false);
    if (onSubmitSearch) {
      onSubmitSearch(value ?? query);
    } else {
      onSearch(value ?? query);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[styles.inputContainer, focused && styles.inputContainerFocused]}
      >
        <TextInput
          {...props}
          value={value ?? query}
          style={[styles.input, style]}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          placeholder={props.placeholder || "Rechercher..."}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setTimeout(() => {
              setFocused(false);
            }, 200);
            onBlur?.(event);
          }}
          onChangeText={(text: string) => {
            setQuery(text);
            onChangeText?.(text);
            onSearch(text);
          }}
        />

        {(value ?? query).length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setQuery("");
              onChangeText?.("");
              onSearch("");
            }}
          >
            <X size={16} color="rgba(255, 255, 255, 0.5)" />
          </Pressable>
        )}

        <Pressable
          style={styles.searchButton}
          onPress={handleSubmit}
        >
          <Search size={20} color="rgba(255, 255, 255, 0.5)" />
        </Pressable>
      </View>

      {filteredSuggestions.length > 0 && (focused || (value ?? query).length > 0) ? (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((item, index) => {
            const releaseYear = item.release_date
              ? new Date(item.release_date).getFullYear()
              : null;
            const validYear = releaseYear && !isNaN(releaseYear) ? releaseYear : null;

            return (
              <Pressable
                key={item.id + "-" + index}
                style={[
                  styles.suggestionItem,
                  index !== filteredSuggestions.length - 1 &&
                    styles.suggestionBorder,
                ]}
                onPress={() => {
                  setQuery(item.title);
                  onChangeText?.(item.title);
                  setFocused(false);
                  if (onSelectSuggestion) {
                    onSelectSuggestion(item);
                  }
                }}
              >
                <View style={styles.posterContainer}>
                  {item.poster_path ? (
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w92${item.poster_path}`,
                      }}
                      style={styles.posterImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.posterPlaceholder}>
                      <Text style={styles.posterPlaceholderText}>N/A</Text>
                    </View>
                  )}
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {validYear && (
                    <Text style={styles.suggestionSubtitle}>
                      {validYear}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(24, 24, 27, 0.5)",
    paddingLeft: 12,
    paddingRight: 8,
  },
  inputContainerFocused: {
    borderColor: "white",
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: 6,
    borderRadius: 999,
  },
  searchButton: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 999,
  },
  suggestionsContainer: {
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgb(24, 24, 27)",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  posterContainer: {
    width: 36,
    height: 52,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 12,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  posterPlaceholderText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionSubtitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginTop: 2,
  },
});

