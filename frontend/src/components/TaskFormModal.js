import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';

import TextField from './TextField';
import PrimaryButton from './PrimaryButton';
import Chip from './Chip';
import api, { errorMessage } from '../api';
import { toast } from '../utils/notify';
import { toISODate, isISODate } from '../utils/dates';
import { useI18n } from '../context/PreferencesContext';

/** Add / edit a task: title, description, due date, status, optional course. */
export default function TaskFormModal({ visible, task, onClose, onSaved }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [courseId, setCourseId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(task?.id);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setDueDate(task?.dueDate || '');
    setStatus(task?.status || 'pending');
    setCourseId(task?.courseId || null);
    setErrors({});
    api.courses.list().then(setCourses).catch(() => setCourses([]));
  }, [visible, task]);

  const quickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDueDate(toISODate(date));
    setErrors((e) => ({ ...e, dueDate: undefined }));
  };

  const handleSave = async () => {
    const nextErrors = {};
    if (title.trim().length < 2) nextErrors.title = 'Please enter a task title.';
    if (dueDate && !isISODate(dueDate)) nextErrors.dueDate = 'Use the format YYYY-MM-DD.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate || null,
        status,
        courseId: courseId || null,
      };

      if (isEdit) await api.tasks.update(task.id, payload);
      else await api.tasks.create(payload);

      toast.success(isEdit ? 'Task updated' : 'Task added', title.trim());
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error('Could not save task', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="max-h-[88%] rounded-t-3xl bg-tint px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-inter-bold text-[18px] text-ink">{isEdit ? t('editTask') : t('newTask')}</Text>
              <Pressable onPress={onClose} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextField
                label={t('taskTitle')}
                placeholder="e.g. Finish lab report"
                value={title}
                onChangeText={setTitle}
                error={errors.title}
                maxLength={120}
                style={{ marginBottom: 16 }}
              />

              <TextField
                label={t('description')}
                placeholder="Optional details…"
                value={description}
                onChangeText={setDescription}
                multiline
                style={{ marginBottom: 16 }}
              />

              <Text className="mb-1.5 font-inter-medium text-[13px] text-ink">{t('dueDate')}</Text>
              <View className="mb-2 flex-row gap-2">
                <Chip label={t('today')} active={dueDate === toISODate(new Date())} onPress={() => quickDate(0)} />
                <Chip
                  label={t('tomorrow')}
                  active={dueDate === toISODate(new Date(Date.now() + 86400000))}
                  onPress={() => quickDate(1)}
                />
                <Chip label="Clear" active={!dueDate} onPress={() => setDueDate('')} />
              </View>
              <TextField
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
                error={errors.dueDate}
                keyboardType="numbers-and-punctuation"
                style={{ marginBottom: 16 }}
              />

              <Text className="mb-1.5 font-inter-medium text-[13px] text-ink">{t('status')}</Text>
              <View className="mb-4 flex-row gap-2">
                <Chip label={t('pending')} active={status === 'pending'} onPress={() => setStatus('pending')} />
                <Chip label={t('done')} active={status === 'done'} onPress={() => setStatus('done')} />
              </View>

              {courses.length ? (
                <>
                  <Text className="mb-1.5 font-inter-medium text-[13px] text-ink">{t('courses')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                    <View className="flex-row gap-2">
                      <Chip label="None" active={!courseId} onPress={() => setCourseId(null)} />
                      {courses.map((course) => (
                        <Chip
                          key={course.id}
                          label={course.name}
                          active={courseId === course.id}
                          onPress={() => setCourseId(course.id)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              <PrimaryButton title={isEdit ? t('save') : t('add')} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
