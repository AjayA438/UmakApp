import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { GraduationCap, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../constants/config';

/** Home header: logo, school name, notification bell (with badge) and profile. */
export default function AppHeader({ notificationCount = 0, onPressBell, onPressProfile }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View
      className="flex-row items-center justify-between border-b border-line bg-white px-5 pb-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-bold text-[17px] leading-5 text-ink">Campus OS</Text>
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
            {user?.schoolName || 'Your school'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onPressBell}
          hitSlop={10}
          className="relative h-10 w-10 items-center justify-center rounded-full bg-primary-50 active:bg-primary-100"
        >
          <Bell size={19} color="#14532D" />
          {notificationCount > 0 ? (
            <View className="absolute right-1.5 top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1">
              <Text className="text-[9px] font-bold text-white">{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={onPressProfile}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-50 active:bg-primary-100"
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: resolveMediaUrl(user.avatarUrl) }} className="h-10 w-10 rounded-full" />
          ) : (
            <User size={19} color="#14532D" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
