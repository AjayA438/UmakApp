import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { User, MapPin, Clock, Pencil, Trash2 } from 'lucide-react-native';

import { DAY_SHORT, formatClockTime } from '../utils/dates';

/** Course card: colour accent, instructor, room and the weekly schedule chips. */
export default function CourseCard({ course, onEdit, onDelete }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <View className="flex-row">
        <View className="w-1.5" style={{ backgroundColor: course.color || '#14532D' }} />

        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text numberOfLines={1} className="font-inter-bold text-[16px] text-ink">
                  {course.name}
                </Text>
                {course.code ? (
                  <View className="rounded-full bg-primary-50 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-primary-600">{course.code}</Text>
                  </View>
                ) : null}
              </View>

              <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
                {course.instructor ? (
                  <View className="flex-row items-center gap-1.5">
                    <User size={13} color="#6B7280" />
                    <Text className="text-[12.5px] text-muted">{course.instructor}</Text>
                  </View>
                ) : null}
                {course.room ? (
                  <View className="flex-row items-center gap-1.5">
                    <MapPin size={13} color="#6B7280" />
                    <Text className="text-[12.5px] text-muted">{course.room}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <Pressable onPress={() => onEdit?.(course)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full active:bg-primary-50">
                <Pencil size={16} color="#5D9A6D" />
              </Pressable>
              <Pressable onPress={() => onDelete?.(course)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full active:bg-danger-tint">
                <Trash2 size={16} color="#B91C1C" />
              </Pressable>
            </View>
          </View>

          {course.schedules?.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {course.schedules.map((slot) => (
                <View key={slot.id || `${slot.dayOfWeek}-${slot.startTime}`} className="flex-row items-center gap-1.5 rounded-xl bg-primary-50 px-2.5 py-1.5">
                  <Clock size={12} color="#2A6540" />
                  <Text className="text-[11.5px] font-medium text-primary-600">
                    {DAY_SHORT[slot.dayOfWeek]} · {formatClockTime(slot.startTime)}–{formatClockTime(slot.endTime)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
