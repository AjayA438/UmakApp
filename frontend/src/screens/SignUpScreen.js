import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { GraduationCap, Mail, Lock, User, School, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/PreferencesContext';
import { toast } from '../utils/notify';
import { errorMessage } from '../api';
import { isValidEmail, isStrongPassword } from '../utils/validators';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', schoolName: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    const nextErrors = {};
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Please enter your full name.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Please enter a valid email address.';
    if (!isStrongPassword(form.password)) nextErrors.password = 'At least 8 characters, with a letter and a number.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      await signUp({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        schoolName: form.schoolName.trim() || undefined,
      });
      toast.success('Welcome to Campus OS!', 'Your account is ready.');
    } catch (error) {
      toast.error('Sign up failed', errorMessage(error));
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
            <Text className="font-inter-bold text-[26px] text-ink">{t('createAccount')}</Text>
            <Text className="mt-1 text-center text-[14px] text-muted">{t('signUpSub')}</Text>
          </View>

          <View className="rounded-3xl border border-line bg-white p-5 shadow-soft">
            <TextField
              label={t('fullName')}
              placeholder="Alex Johnson"
              icon={User}
              value={form.fullName}
              onChangeText={update('fullName')}
              error={errors.fullName}
              style={{ marginBottom: 16 }}
            />

            <TextField
              label={t('email')}
              placeholder="you@school.edu"
              icon={Mail}
              value={form.email}
              onChangeText={update('email')}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: 16 }}
            />

            <TextField
              label={t('schoolName')}
              placeholder="Springfield University"
              icon={School}
              value={form.schoolName}
              onChangeText={update('schoolName')}
              style={{ marginBottom: 16 }}
            />

            <TextField
              label={t('password')}
              placeholder="At least 8 characters"
              icon={Lock}
              secure
              value={form.password}
              onChangeText={update('password')}
              error={errors.password}
            />

            <PrimaryButton title={t('signUp')} icon={ArrowRight} onPress={handleSubmit} loading={loading} className="mt-6" />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1.5">
            <Text className="text-[13.5px] text-muted">{t('hasAccount')}</Text>
            <Pressable onPress={() => navigation.navigate('Login')} className="active:opacity-70">
              <Text className="font-inter-semibold text-[13.5px] text-primary-600">{t('signIn')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
