import { type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export type ButtonProps = PressableProps & {
  children?: ReactNode;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  label,
  variant = "default",
  size = "default",
  style,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    default: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    secondary: {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.backgroundElement,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: theme.backgroundSelected,
      borderWidth: StyleSheet.hairlineWidth,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
    },
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    default: {
      minHeight: 48,
      paddingHorizontal: Spacing.four,
    },
    sm: {
      minHeight: 40,
      paddingHorizontal: Spacing.three,
    },
    lg: {
      minHeight: 56,
      paddingHorizontal: Spacing.five,
    },
    icon: {
      height: 44,
      width: 44,
      paddingHorizontal: 0,
    },
  };

  const textStyles: Record<ButtonVariant, TextStyle> = {
    default: { color: theme.background },
    secondary: { color: theme.text },
    outline: { color: theme.text },
    ghost: { color: theme.text },
    destructive: { color: "#ffffff" },
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.root,
        variantStyles[variant],
        sizeStyles[size],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {children ?? (
        <Text style={[styles.label, textStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
