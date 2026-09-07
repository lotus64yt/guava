import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <View className="flex-row items-center justify-center space-x-4 py-6 w-full">
      <Pressable
        onPress={() => !isFirstPage && onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        className={`p-2 rounded-lg border border-white/20 bg-zinc-900 ${
          isFirstPage ? "opacity-50" : "active:bg-white/10"
        }`}
      >
        <ChevronLeft size={20} color="white" />
      </Pressable>

      <View className="px-4 py-2 rounded-lg bg-zinc-950 border border-white/10">
        <Text className="text-white font-medium text-base">
          Page {currentPage} sur {totalPages}
        </Text>
      </View>

      <Pressable
        onPress={() => !isLastPage && onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className={`p-2 rounded-lg border border-white/20 bg-zinc-900 ${
          isLastPage ? "opacity-50" : "active:bg-white/10"
        }`}
      >
        <ChevronRight size={20} color="white" />
      </Pressable>
    </View>
  );
}
