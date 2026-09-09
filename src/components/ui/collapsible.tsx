import { ChevronRight } from "lucide-react-native";
import { PropsWithChildren, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <Card>
      <CardHeader style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsOpen((value) => !value)}
          style={({ pressed }) => [
            styles.heading,
            pressed && styles.pressedHeading,
          ]}
        >
          <View style={styles.button}>
            <ChevronRight
              size={14}
              color={theme.text}
              style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
            />
          </View>

          <Label>{title}</Label>
        </Pressable>
      </CardHeader>

      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <CardContent style={styles.content}>{children}</CardContent>
        </Animated.View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 0,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  pressedHeading: {
    opacity: 0.7,
  },
  button: {
    width: Spacing.four,
    height: Spacing.four,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
    marginLeft: Spacing.four,
    paddingTop: 0,
  },
});
