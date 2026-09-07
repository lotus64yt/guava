import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 w-full">
      <SafeAreaView
        className="flex-1 w-full self-center items-stretch px-4"
        style={{
          paddingBottom: BottomTabInset + Spacing.three,
          maxWidth: MaxContentWidth,
        }}
      >
        <ScrollView
          contentContainerClassName="grow justify-center py-4"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView className="items-center justify-center w-full"></ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
