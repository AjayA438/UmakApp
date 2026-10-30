import React from 'react';
import { View, Image, Text } from 'react-native';

/** Circular avatar with initials fallback (used on Home + Profile). */
export default function Avatar({ uri, name = '', size = 48 }) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[style, { borderWidth: 2, borderColor: '#FFFFFF' }]} />;
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <View style={[style, { borderWidth: 2, borderColor: '#FFFFFF' }]} className="items-center justify-center bg-primary-400">
      <Text style={{ fontSize: size * 0.36 }} className="font-inter-bold text-white">
        {initials || 'S'}
      </Text>
    </View>
  );
}
