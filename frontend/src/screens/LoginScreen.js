import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/PreferencesContext';
import { toast } from '../utils/notify';
import { errorMessage } from '../api';
import { isValidEmail } from '../utils/validators';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const nextErrors = {};
    if (!isValidEmail(email)) nextErrors.email = 'Please enter a valid email address.';
    if (!password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      toast.success('Signed in', `Welcome back!`);
    } catch (error) {
      toast.error('Sign in failed', errorMessage(error, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-tint">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="grow px-6 pb-10 pt-8" keyboardShouldPersistTaps="handled">
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-floating">
              <GraduationCap size={40} color="#FFFFFF" />
            </View>
            <Text className="font-inter-bold text-[26px] text-ink">Campus OS</Text>
            <Text className="mt-1 text-center text-[14px] text-muted">{t('welcomeSub')}</Text>
          </View>

          <View className="rounded-3xl border border-line bg-white p-5 shadow-soft">
            <TextField
              label={t('email')}
              placeholder="you@school.edu"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={{ marginBottom: 16 }}
            />

            <TextField
              label={t('password')}
              placeholder="••••••••"
              icon={Lock}
              secure
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              style={{ marginBottom: 12 }}
            />

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} className="self-end active:opacity-70">
              <Text className="font-inter-medium text-[13px] text-primary-600">{t('forgotPassword')}</Text>
            </Pressable>

            <PrimaryButton title={t('signIn')} icon={ArrowRight} onPress={handleLogin} loading={loading} className="mt-6" />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1.5">
            <Text className="text-[13.5px] text-muted">{t('noAccount')}</Text>
            <Pressable onPress={() => navigation.navigate('SignUp')} className="active:opacity-70">
              <Text className="font-inter-semibold text-[13.5px] text-primary-600">{t('signUp')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
