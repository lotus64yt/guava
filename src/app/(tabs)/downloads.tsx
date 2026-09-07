import { Text, View } from "react-native";

export default function DownloadsScreen() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-zinc-400 text-lg">
        Aucun film n'a été téléchargé.
      </Text>
    </View>
  );
}
