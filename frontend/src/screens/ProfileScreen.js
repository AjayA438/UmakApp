import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Settings, Camera, Mail, GraduationCap, BadgeCheck, School, CalendarDays, CheckCircle2, BookOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/PreferencesContext';
import api, { errorMessage } from '../api';
import { toast } from '../utils/notify';
import { formatDateLong } from '../utils/dates';
import { resolveMediaUrl } from '../constants/config';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
        <Icon size={16} color="#2A6540" />
      </View>
      <View className="flex-1">
        <Text className="text-[11.5px] uppercase tracking-wide text-muted">{label}</Text>
        <Text numberOfLines={1} className="font-inter-medium text-[14.5px] text-ink">
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-white py-4 shadow-card">
      <Icon size={18} color="#14532D" />
      <Text className="mt-1.5 font-inter-bold text-[20px] text-ink">{value}</Text>
      <Text className="text-[11.5px] text-muted">{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();

  const [stats, setStats] = useState({ pending: 0, done: 0, courses: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await api.user.stats());
    } catch (error) {
      // Stats are cosmetic — never block the screen on them.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Permission needed', 'Allow photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      name: asset.fileName || 'profile.jpg',
      type: asset.mimeType || 'image/jpeg',
    });

    try {
      setUploading(true);
      const data = await api.user.uploadAvatar(formData);
      updateUser({ avatarUrl: data.avatarUrl });
      toast.success('Photo updated', 'Looking good!');
    } catch (error) {
      toast.error('Upload failed', errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-tint">
      <ScreenHeader
        title={t('profile')}
        right={
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary-50 active:bg-primary-100"
          >
            <Settings size={18} color="#14532D" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-10 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14532D" />}
      >
        {/* ── Avatar + name ──────────────────────────── */}
        <View className="items-center">
          <Pressable onPress={pickPhoto} className="active:opacity-80" disabled={uploading}>
            <Avatar uri={resolveMediaUrl(user?.avatarUrl)} name={user?.fullName} size={96} />
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-tint bg-primary">
              <Camera size={14} color="#FFFFFF" />
            </View>
          </Pressable>

          <Text className="mt-3 font-inter-bold text-[20px] text-ink">{user?.fullName}</Text>
          <Text className="mt-0.5 text-[13px] text-muted">{user?.email}</Text>

          <Pressable
            onPress={pickPhoto}
            className="mt-3 rounded-full border border-primary-200 bg-white px-4 py-1.5 active:bg-primary-50"
          >
            <Text className="font-inter-medium text-[12.5px] text-primary-600">
              {uploading ? 'Uploading…' : t('changePhoto')}
            </Text>
          </Pressable>
        </View>

        {/* ── Stats ──────────────────────────────────── */}
        <View className="flex-row gap-3">
          <Stat icon={CheckCircle2} value={stats.done} label={t('done')} />
          <Stat icon={CalendarDays} value={stats.pending} label={t('pending')} />
          <Stat icon={BookOpen} value={stats.courses} label={t('courses')} />
        </View>

        {/* ── Personal info ──────────────────────────── */}
        <View className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <View className="border-b border-line px-4 py-3">
            <Text className="font-inter-semibold text-[14px] text-ink">{t('personalInfo')}</Text>
          </View>
          <InfoRow icon={GraduationCap} label={t('fullName')} value={user?.fullName} />
          <InfoRow icon={School} label={t('schoolName')} value={user?.schoolName} />
          <InfoRow icon={BadgeCheck} label={t('studentId')} value={user?.studentId} />
          <InfoRow icon={Mail} label={t('email')} value={user?.email} />
          <InfoRow
            icon={CalendarDays}
            label={t('memberSince')}
            value={user?.createdAt ? formatDateLong(new Date(user.createdAt)) : null}
          />
        </View>

        <PrimarySettingsButton onPress={() => navigation.navigate('Settings')} label={t('settings')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimarySettingsButton({ onPress, label }) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 active:opacity-80"
    >
      <Settings size={17} color="#FFFFFF" />
      <Text className="font-inter-semibold text-[14.5px] text-white">{label}</Text>
    </Pressable>
  );
}
