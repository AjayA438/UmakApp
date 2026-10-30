import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { KeyRound, Mail, Lock, Send, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import api, { errorMessage } from '../api';
import { isValidEmail } from '../utils/validators';
import { toast } from '../utils/notify';
import { useI18n } from '../context/PreferencesContext';

/**
 * Two-step flow:
 *  1. request a reset email,
 *  2. paste the token from that email + choose a new password.
 */
export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const data = await api.auth.forgotPassword(email.trim());
      toast.info('Check your inbox', data.message);
      setStep(2);
    } catch (error) {
      toast.error('Could not send the email', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const nextErrors = {};
    if (token.trim().length < 8) nextErrors.token = 'Paste the code from your email.';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      nextErrors.password = 'At least 8 characters, with a letter and a number.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      await api.auth.resetPassword(token.trim(), password);
      toast.success('Password updated', 'You can sign in now.');
      navigation.navigate('Login');
    } catch (error) {
      toast.error('Reset failed', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-tint">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="grow px-6 pb-10 pt-6" keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
            hitSlop={12}
            className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-white active:bg-primary-50"
          >
            <ChevronLeft size={22} color="#14532D" />
          </Pressable>

          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-floating">
              <KeyRound size={36} color="#FFFFFF" />
            </View>
            <Text className="font-inter-bold text-[24px] text-ink">{t('resetTitle')}</Text>
            <Text className="mt-1 text-center text-[14px] text-muted">{t('resetSub')}</Text>
          </View>

          {step === 1 ? (
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
              />
              <PrimaryButton title="Send reset link" icon={Send} onPress={handleSend} loading={loading} className="mt-6" />
            </View>
          ) : (
            <View className="rounded-3xl border border-line bg-white p-5 shadow-soft">
              <TextField
                label="Reset code"
                placeholder="Paste the code from the email"
                value={token}
                onChangeText={setToken}
                error={errors.token}
                autoCapitalize="none"
                style={{ marginBottom: 16 }}
              />
              <TextField
                label="New password"
                placeholder="At least 8 characters"
                icon={Lock}
                secure
                value={password}
                onChangeText={setPassword}
                error={errors.password}
              />
              <PrimaryButton title="Update password" onPress={handleReset} loading={loading} className="mt-6" />
            </View>
          )}

          <Pressable onPress={() => navigation.navigate('Login')} className="mt-8 self-center active:opacity-70">
            <Text className="font-inter-medium text-[13.5px] text-primary-600">{t('signIn')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
