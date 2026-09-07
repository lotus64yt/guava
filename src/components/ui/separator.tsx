import { StyleSheet, View, type ViewProps } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Separator({ style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="separator"
      style={[
        styles.separator,
        {
          backgroundColor: theme.backgroundSelected,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
    width: "100%",
  },
});
