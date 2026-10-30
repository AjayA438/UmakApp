import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Share, Platform } from 'react-native';
import {
  Share2, Star, Mail, RotateCcw, Trash2, LogIn, LogOut, Globe, Shield, FileText, ChevronRight,
} from 'lucide-react-native';

import ScreenHeader from '../components/ScreenHeader';
import ContactModal from '../components/ContactModal';
import LanguageModal from '../components/LanguageModal';

import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/PreferencesContext';
import api, { errorMessage } from '../api';
import { toast, confirmAction } from '../utils/notify';
import { APP_NAME, STORE_URL, LEGAL_URLS } from '../constants/config';
import { LANGUAGES } from '../i18n/translations';

/** Icon + label row separated by a thin divider (Settings list). */
function Row({ icon: Icon, label, onPress, right, danger = false, last = false }) {
  return (
    <>
      <Pressable
        onPress={onPress}
        className={`flex-row items-center gap-3.5 px-5 py-4 active:bg-primary-50 ${danger ? 'bg-transparent' : 'bg-white'}`}
      >
        <View className={`h-9 w-9 items-center justify-center rounded-xl ${danger ? 'bg-danger-tint' : 'bg-primary-50'}`}>
          <Icon size={17} color={danger ? '#B91C1C' : '#2A6540'} />
        </View>

        <Text className={`flex-1 font-inter-medium text-[14.5px] ${danger ? 'text-danger' : 'text-ink'}`}>{label}</Text>

        {right ?? <ChevronRight size={17} color="#9CA3AF" />}
      </Pressable>
      {!last ? <View className="ml-[68px] h-px bg-line" /> : null}
    </>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { t, language } = useI18n();

  const [contactVisible, setContactVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);

  const activeLanguage = LANGUAGES.find((item) => item.code === language);

  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else toast.error('Cannot open link', url);
  };

  const handleShare = async () => {
    const message = `Check out ${APP_NAME} — the all-in-one student planner!`;
    const url = Platform.OS === 'ios' ? STORE_URL.ios : STORE_URL.android;

    try {
      if (Platform.OS === 'web') {
        // react-native's Share module isn't implemented on web.
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: APP_NAME, text: message, url });
        } else {
          await Linking.openURL(url);
          toast.info('Opening store page', 'Share the link with your classmates!');
        }
        return;
      }
      await Share.share({ message: `${message} ${url}` });
    } catch (error) {
      toast.error('Could not share', errorMessage(error));
    }
  };

  const handleRate = () => openLink(Platform.OS === 'ios' ? STORE_URL.ios : STORE_URL.android);

  const handleReset = () =>
    confirmAction(
      t('resetAccount'),
      'This permanently deletes ALL your tasks and courses. Your account stays active. This cannot be undone.',
      async () => {
        try {
          const data = await api.user.resetAccount();
          toast.success(t('resetAccount'), data.message);
        } catch (error) {
          toast.error('Could not reset the account', errorMessage(error));
        }
      },
      { confirmLabel: 'Reset', destructive: true }
    );

  const handleDelete = () =>
    confirmAction(
      t('deleteAccount'),
      'This permanently deletes your account and everything in it. This cannot be undone.',
      async () => {
        try {
          await api.user.deleteAccount();
          toast.success(t('deleteAccount'), 'Your account has been deleted.');
          await signOut();
        } catch (error) {
          toast.error('Could not delete the account', errorMessage(error));
        }
      },
      { confirmLabel: 'Delete', destructive: true }
    );

  const handleLogout = () =>
    confirmAction(t('logout'), 'You can sign back in any time.', async () => {
      await signOut(true);
      toast.success(t('logout'), 'See you soon!');
    }, { confirmLabel: t('logout') });

  return (
    <View className="flex-1 bg-tint">
      <ScreenHeader title={t('settings')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerClassName="grow pb-10 pt-4" showsVerticalScrollIndicator={false}>
        {/* ── Account card ───────────────────────────── */}
        <View className="mx-5 mb-5 flex-row items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Text className="font-inter-bold text-[15px] text-white">
              {(user?.fullName || 'S').split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </Text>
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-semibold text-[14.5px] text-ink">{user?.fullName}</Text>
            <Text numberOfLines={1} className="text-[12px] text-muted">{user?.email}</Text>
          </View>
        </View>

        {/* ── General ────────────────────────────────── */}
        <Text className="mb-2 px-5 text-[11.5px] font-semibold uppercase tracking-wide text-muted">General</Text>
        <View className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <Row icon={Share2} label={t('shareApp')} onPress={handleShare} />
          <Row icon={Star} label={t('rateUs')} onPress={handleRate} />
          <Row icon={Mail} label={t('contactUs')} onPress={() => setContactVisible(true)} />
        </View>

        {/* ── Account ────────────────────────────────── */}
        <Text className="mb-2 mt-6 px-5 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Account</Text>
        <View className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <Row
            icon={Globe}
            label={t('language')}
            onPress={() => setLanguageVisible(true)}
            right={
              <View className="flex-row items-center gap-1.5">
                {activeLanguage ? <Text className="text-[13px] text-muted">{activeLanguage.flag} {activeLanguage.label}</Text> : null}
                <ChevronRight size={17} color="#9CA3AF" />
              </View>
            }
          />
          <Row icon={RotateCcw} label={t('resetAccount')} onPress={handleReset} />
          <Row icon={Trash2} label={t('deleteAccount')} onPress={handleDelete} danger />

          {user ? (
            <Row icon={LogOut} label={t('logout')} onPress={handleLogout} danger last />
          ) : (
            <Row icon={LogIn} label={t('login')} onPress={() => navigation.navigate('Login')} last />
          )}
        </View>

        {/* ── Legal ─────────────────────────────────── */}
        <Text className="mb-2 mt-6 px-5 text-[11.5px] font-semibold uppercase tracking-wide text-muted">About</Text>
        <View className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <Row icon={Shield} label={t('privacy')} onPress={() => openLink(LEGAL_URLS.privacy)} />
          <Row icon={FileText} label={t('terms')} onPress={() => openLink(LEGAL_URLS.terms)} last />
        </View>

        <Text className="mt-6 text-center text-[11.5px] text-muted">{APP_NAME} · v1.0.0</Text>
      </ScrollView>

      <ContactModal visible={contactVisible} onClose={() => setContactVisible(false)} />
      <LanguageModal visible={languageVisible} onClose={() => setLanguageVisible(false)} />
    </View>
  );
}
