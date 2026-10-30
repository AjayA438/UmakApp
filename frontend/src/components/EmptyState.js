import React from 'react';
import { View, Text } from 'react-native';

/** Friendly placeholder for empty lists. */
export default function EmptyState({ icon: Icon, title, subtitle, children }) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-primary-200 bg-white/70 px-6 py-10">
      {Icon ? (
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <Icon size={26} color="#5D9A6D" />
        </View>
      ) : null}
      <Text className="font-inter-semibold text-[15px] text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 text-center text-[13px] leading-5 text-muted">{subtitle}</Text> : null}
      {children ? <View className="mt-4 w-full">{children}</View> : null}
    </View>
  );
}
