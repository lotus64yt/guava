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

interface SearchInputProps extends TextInputProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
  containerStyle?: object;
}

export function SearchInput({
  style,
  containerStyle,
  onSearch,
  suggestions = [],
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
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4),
    [suggestions, query],
  );

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
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChangeText={(text: string) => {
            setQuery(text);
            onChangeText?.(text);
            onSearch(text);
          }}
        />

        {query.length > 0 && (
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
          onPress={() => {
            onSearch(query);
          }}
        >
          <Search size={20} color="rgba(255, 255, 255, 0.5)" />
        </Pressable>
      </View>

      {focused && filteredSuggestions.length > 0 ? (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((item, index) => (
            <Pressable
              key={item + index}
              style={[
                styles.suggestionItem,
                index !== filteredSuggestions.length - 1 &&
                  styles.suggestionBorder,
              ]}
              onPress={() => {
                setQuery(item);
                onChangeText?.(item);
                onSearch(item);
                setFocused(false);
              }}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
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
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  suggestionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
