import React from 'react';
import { Pressable, Text } from 'react-native';

/** Pill used for filters, quick date picks, days of the week, … */
export default function Chip({ label, active, onPress, className = '' }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 active:opacity-75 ${
        active ? 'border-primary bg-primary' : 'border-line bg-white'
      } ${className}`}
    >
      <Text className={`font-inter-medium text-[13px] ${active ? 'text-white' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
