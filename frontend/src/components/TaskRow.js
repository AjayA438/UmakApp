import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, Calendar, Pencil, Trash2, Tag } from 'lucide-react-native';

import { dueLabel, isOverdue } from '../utils/dates';

/**
 * One task row: round checkbox (marks done), title, due-date chip,
 * optional course tag, and edit / delete actions when `actions` is true.
 */
export default function TaskRow({ task, onToggle, onEdit, onDelete, actions = false }) {
  const done = task.status === 'done';
  const label = dueLabel(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 shadow-card">
      <Pressable
        onPress={() => onToggle?.(task)}
        hitSlop={8}
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          done ? 'border-primary bg-primary' : 'border-primary-200 bg-white'
        }`}
      >
        {done ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
      </Pressable>

      <View className="flex-1">
        <Text numberOfLines={2} className={`font-inter-medium text-[15px] leading-5 ${done ? 'text-muted line-through' : 'text-ink'}`}>
          {task.title}
        </Text>

        <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
          {label ? (
            <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${overdue ? 'bg-danger-tint' : 'bg-primary-50'}`}>
              <Calendar size={11} color={overdue ? '#B91C1C' : '#2A6540'} />
              <Text className={`text-[11px] font-medium ${overdue ? 'text-danger' : 'text-primary-600'}`}>{label}</Text>
            </View>
          ) : null}

          {task.course ? (
            <View className="flex-row items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: task.course.color || '#14532D' }} />
              <Text numberOfLines={1} className="max-w-[130px] text-[11px] font-medium text-primary-600">
                {task.course.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {actions ? (
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => onEdit?.(task)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full active:bg-primary-50">
            <Pencil size={16} color="#5D9A6D" />
          </Pressable>
          <Pressable onPress={() => onDelete?.(task)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full active:bg-danger-tint">
            <Trash2 size={16} color="#B91C1C" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
