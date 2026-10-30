import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { X, Check } from 'lucide-react-native';

import { useI18n } from '../context/PreferencesContext';

/** Flag picker used by the "Choose your language" settings row. */
export default function LanguageModal({ visible, onClose }) {
  const { languages, language, setLanguage } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-tint px-5 pb-10 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-inter-bold text-[18px] text-ink">Choose your language</Text>
            <Pressable onPress={onClose} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full bg-white">
              <X size={18} color="#6B7280" />
            </Pressable>
          </View>

          <View className="gap-2">
            {languages.map((item) => {
              const active = item.code === language;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setLanguage(item.code);
                    onClose();
                  }}
                  className={`flex-row items-center gap-3 rounded-2xl border bg-white px-4 py-4 ${
                    active ? 'border-primary' : 'border-line'
                  } active:opacity-80`}
                >
                  <Text className="text-[22px]">{item.flag}</Text>
                  <Text className={`flex-1 font-inter-medium text-[15px] ${active ? 'text-primary' : 'text-ink'}`}>
                    {item.label}
                  </Text>
                  {active ? <Check size={18} color="#14532D" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
