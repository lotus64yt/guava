import { type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewProps,
} from "react-native";

import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  const theme = useTheme();

  return (
    <Text style={[styles.title, { color: theme.text }, style]} {...props} />
  );
}

export function CardDescription({ style, ...props }: TextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[styles.description, { color: theme.textSecondary }, style]}
      {...props}
    />
  );
}

type CardBodyProps = {
  children?: ReactNode;
};

export function CardBody({ children }: CardBodyProps) {
  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
  },
  footer: {
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  description: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
});
