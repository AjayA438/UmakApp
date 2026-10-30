import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send } from 'lucide-react-native';

import TextField from './TextField';
import PrimaryButton from './PrimaryButton';
import api, { errorMessage } from '../api';
import { toast } from '../utils/notify';

/** "Contact us" — the message is emailed to the support inbox via Nodemailer. */
export default function ContactModal({ visible, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState({});
  const [sending, setSending] = useState(false);

  const reset = () => {
    setSubject('');
    setMessage('');
    setError({});
  };

  const handleSend = async () => {
    const nextErrors = {};
    if (subject.trim().length < 2) nextErrors.subject = 'Please add a subject.';
    if (message.trim().length < 10) nextErrors.message = 'Please write at least 10 characters.';
    setError(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSending(true);
      const data = await api.contact.send({ subject: subject.trim(), message: message.trim() });
      toast.success('Message sent', data.message);
      reset();
      onClose();
    } catch (err) {
      toast.error('Could not send message', errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="rounded-t-3xl bg-tint px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-inter-bold text-[18px] text-ink">Contact us</Text>
              <Pressable onPress={onClose} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            <TextField
              label="Subject"
              placeholder="How can we help?"
              value={subject}
              onChangeText={setSubject}
              error={error.subject}
              style={{ marginBottom: 16 }}
            />

            <TextField
              label="Message"
              placeholder="Tell us a bit more…"
              value={message}
              onChangeText={setMessage}
              error={error.message}
              multiline
              style={{ marginBottom: 20 }}
            />

            <PrimaryButton title="Send message" icon={Send} onPress={handleSend} loading={sending} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
