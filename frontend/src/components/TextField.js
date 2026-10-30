import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

/** Labelled input with error state; `secure` toggles the eye icon. */
export default function TextField({ label, error, secure, icon: Icon, style, ...props }) {
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View style={style}>
      {label ? <Text className="mb-1.5 font-inter-medium text-[13px] text-ink">{label}</Text> : null}

      <View
        className={`flex-row items-center gap-2.5 rounded-2xl border bg-white px-4 ${
          error ? 'border-danger' : 'border-line focus:border-primary-400'
        }`}
      >
        {Icon ? <Icon size={18} color={error ? '#B91C1C' : '#5D9A6D'} /> : null}

        <TextInput
          placeholderTextColor="#9CA3AF"
          className="h-[52px] flex-1 font-inter text-[15px] text-ink"
          secureTextEntry={hidden}
          {...props}
        />

        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
            {hidden ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
          </Pressable>
        ) : null}
      </View>

      {error ? <Text className="mt-1.5 text-[12px] text-danger">{error}</Text> : null}
    </View>
  );
}
