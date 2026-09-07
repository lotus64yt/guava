import { StyleSheet, Text, type TextProps } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Label({ style, ...props }: TextProps) {
  const theme = useTheme();

  return (
    <Text style={[styles.label, { color: theme.text }, style]} {...props} />
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
