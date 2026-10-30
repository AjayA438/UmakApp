import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

const STYLES = {
  success: { icon: CheckCircle2, bg: 'bg-primary', text: 'text-white' },
  error: { icon: AlertCircle, bg: 'bg-danger', text: 'text-white' },
  info: { icon: Info, bg: 'bg-primary-600', text: 'text-white' },
};

/** Custom skins for react-native-toast-message (rendered at the app root). */
export default function ToastConfig({ type = 'info', text1, text2 }) {
  const style = STYLES[type] || STYLES.info;
  const Icon = style.icon;

  return (
    <View className={`mx-4 mt-12 flex-row items-center gap-3 rounded-2xl px-4 py-3.5 shadow-floating ${style.bg}`}>
      <Icon size={22} color="#FFFFFF" />
      <View className="flex-1">
        <Text className={`font-inter-semibold text-[15px] ${style.text}`}>{text1}</Text>
        {text2 ? <Text className={`mt-0.5 text-[13px] opacity-90 ${style.text}`}>{text2}</Text> : null}
      </View>
    </View>
  );
}
