import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Loader({ label }) {
  return (
    <View className="flex-1 items-center justify-center bg-tint">
      <ActivityIndicator size="large" color="#14532D" />
      {label ? <Text className="mt-4 font-inter-medium text-sm text-primary-600">{label}</Text> : null}
    </View>
  );
}
