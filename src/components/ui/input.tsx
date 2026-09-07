import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export const Input = forwardRef<TextInput, TextInputProps>(function Input(
  { style, placeholderTextColor, ...props },
  ref,
) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}
    >
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? theme.textSecondary}
        style={[styles.input, { color: theme.text }, style]}
        {...props}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 48,
    paddingVertical: 12,
  },
});
