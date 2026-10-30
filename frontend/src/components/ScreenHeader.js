import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Header with a back arrow + centred title (Settings, etc.). */
export default function ScreenHeader({ title, onBack, right }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between border-b border-line bg-white px-2 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable onPress={onBack} hitSlop={12} className="h-10 w-10 items-center justify-center rounded-full active:bg-primary-50">
        <ChevronLeft size={24} color="#14532D" />
      </Pressable>

      <Text className="font-inter-bold text-[17px] text-ink">{title}</Text>

      <View className="h-10 w-10 items-center justify-center">{right}</View>
    </View>
  );
}
