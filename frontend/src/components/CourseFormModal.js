import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';

import TextField from './TextField';
import PrimaryButton from './PrimaryButton';
import Chip from './Chip';
import api, { errorMessage } from '../api';
import { toast } from '../utils/notify';
import { DAY_SHORT } from '../utils/dates';
import { useI18n } from '../context/PreferencesContext';

const COLORS = ['#14532D', '#2A6540', '#0E7490', '#7C3AED', '#B45309', '#BE123C'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptySlot = () => ({ dayOfWeek: new Date().getDay(), startTime: '', endTime: '', key: Math.random().toString(36).slice(2) });

/** Add / edit a course, including its weekly schedule rows. */
export default function CourseFormModal({ visible, course, onClose, onSaved }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [slots, setSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(course?.id);

  useEffect(() => {
    if (!visible) return;
    setName(course?.name || '');
    setCode(course?.code || '');
    setInstructor(course?.instructor || '');
    setRoom(course?.room || '');
    setColor(course?.color || COLORS[0]);
    setErrors({});
    setSlots(
      course?.schedules?.length
        ? course.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, key: Math.random().toString(36).slice(2) }))
        : [emptySlot()]
    );
  }, [visible, course]);

  const updateSlot = (key, patch) => setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));

  const handleSave = async () => {
    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = 'Please enter a course name.';

    const validSlots = slots.filter((s) => s.startTime || s.endTime);
    for (const slot of validSlots) {
      if (!TIME_RE.test(slot.startTime) || !TIME_RE.test(slot.endTime)) {
        nextErrors.slots = 'Class times must look like 09:00.';
        break;
      }
      if (slot.endTime <= slot.startTime) {
        nextErrors.slots = 'End time must be after start time.';
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        code: code.trim() || null,
        instructor: instructor.trim() || null,
        room: room.trim() || null,
        color,
        schedules: validSlots.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
      };

      if (isEdit) await api.courses.update(course.id, payload);
      else await api.courses.create(payload);

      toast.success(isEdit ? 'Course updated' : 'Course added', name.trim());
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error('Could not save course', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="max-h-[90%] rounded-t-3xl bg-tint px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-inter-bold text-[18px] text-ink">{isEdit ? t('editCourse') : t('newCourse')}</Text>
              <Pressable onPress={onClose} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextField
                label={t('courseName')}
                placeholder="e.g. Linear Algebra"
                value={name}
                onChangeText={setName}
                error={errors.name}
                style={{ marginBottom: 16 }}
              />

              <View className="mb-4 flex-row gap-3">
                <TextField label={t('code')} placeholder="MATH-201" value={code} onChangeText={setCode} style={{ flex: 1 }} />
                <TextField label={t('room')} placeholder="B-104" value={room} onChangeText={setRoom} style={{ flex: 1 }} />
              </View>

              <TextField
                label={t('instructor')}
                placeholder="e.g. Dr. Smith"
                value={instructor}
                onChangeText={setInstructor}
                style={{ marginBottom: 16 }}
              />

              <Text className="mb-2 font-inter-medium text-[13px] text-ink">Colour</Text>
              <View className="mb-5 flex-row gap-3">
                {COLORS.map((swatch) => (
                  <Pressable
                    key={swatch}
                    onPress={() => setColor(swatch)}
                    className={`h-8 w-8 items-center justify-center rounded-full ${color === swatch ? 'border-2 border-ink' : 'border-2 border-transparent'}`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </View>

              <Text className="mb-2 font-inter-medium text-[13px] text-ink">{t('schedule')}</Text>
              {errors.slots ? <Text className="mb-2 text-[12px] text-danger">{errors.slots}</Text> : null}

              <View className="gap-3">
                {slots.map((slot) => (
                  <View key={slot.key} className="rounded-2xl border border-line bg-white p-3">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-1.5">
                        {DAY_SHORT.map((day, index) => (
                          <Chip
                            key={day}
                            label={day}
                            active={slot.dayOfWeek === index}
                            onPress={() => updateSlot(slot.key, { dayOfWeek: index })}
                          />
                        ))}
                      </View>
                    </ScrollView>

                    <View className="mt-3 flex-row items-end gap-2">
                      <TextField
                        label={t('startTime')}
                        placeholder="09:00"
                        value={slot.startTime}
                        onChangeText={(value) => updateSlot(slot.key, { startTime: value })}
                        keyboardType="numbers-and-punctuation"
                        style={{ flex: 1 }}
                      />
                      <TextField
                        label={t('endTime')}
                        placeholder="10:30"
                        value={slot.endTime}
                        onChangeText={(value) => updateSlot(slot.key, { endTime: value })}
                        keyboardType="numbers-and-punctuation"
                        style={{ flex: 1 }}
                      />
                      {slots.length > 1 ? (
                        <Pressable
                          onPress={() => setSlots((current) => current.filter((s) => s.key !== slot.key))}
                          hitSlop={8}
                          className="mb-1 h-10 w-10 items-center justify-center rounded-xl bg-danger-tint"
                        >
                          <Trash2 size={16} color="#B91C1C" />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => setSlots((current) => [...current, emptySlot()])}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-200 py-3 active:bg-primary-50"
              >
                <Plus size={16} color="#2A6540" />
                <Text className="font-inter-medium text-[13px] text-primary-600">{t('addTime')}</Text>
              </Pressable>

              <PrimaryButton
                title={isEdit ? t('save') : t('add')}
                onPress={handleSave}
                loading={saving}
                className="mt-6"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
