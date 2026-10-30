import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Plus, ListTodo } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TaskRow from '../components/TaskRow';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import TaskFormModal from '../components/TaskFormModal';

import { useI18n } from '../context/PreferencesContext';
import api, { errorMessage } from '../api';
import { toast, confirmAction } from '../utils/notify';

const FILTERS = ['all', 'pending', 'done'];

export default function TasksScreen() {
  const { t } = useI18n();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState({ visible: false, task: null });

  const load = useCallback(async () => {
    try {
      setTasks(await api.tasks.list());
    } catch (error) {
      toast.error(t('tasks'), errorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.status === filter)),
    [tasks, filter]
  );

  const toggle = async (task) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    try {
      await api.tasks.update(task.id, { status: nextStatus });
    } catch (error) {
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: task.status } : item)));
      toast.error('Could not update the task', errorMessage(error));
    }
  };

  const remove = (task) =>
    confirmAction(t('delete'), `Delete "${task.title}"?`, async () => {
      try {
        await api.tasks.remove(task.id);
        setTasks((current) => current.filter((item) => item.id !== task.id));
        toast.success(t('delete'), 'Task deleted.');
      } catch (error) {
        toast.error('Could not delete the task', errorMessage(error));
      }
    }, { confirmLabel: t('delete'), destructive: true });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };

  return (
    <SafeAreaView className="flex-1 bg-tint">
      <View className="border-b border-line bg-white px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-inter-bold text-[22px] text-ink">{t('tasks')}</Text>
            <Text className="mt-0.5 text-[12.5px] text-muted">
              {counts.pending} pending · {counts.done} done
            </Text>
          </View>

          <Pressable
            onPress={() => setModal({ visible: true, task: null })}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-2">
          {FILTERS.map((key) => (
            <Chip
              key={key}
              label={`${t(key)} (${counts[key]})`}
              active={filter === key}
              onPress={() => setFilter(key)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerClassName="grow gap-2.5 px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListEmptyComponent={
          loading ? null : (
            <View className="pt-6">
              <EmptyState
                icon={ListTodo}
                title={filter === 'all' ? t('noTasks') : `${t(filter)} · 0`}
                subtitle={t('noTasksHint')}
              />
            </View>
          )
        }
        renderItem={({ item }) => <TaskRow task={item} onToggle={toggle} onEdit={(task) => setModal({ visible: true, task })} onDelete={remove} actions />}
      />

      {/* Floating add button, clear of the tab bar */}
      <Pressable
        onPress={() => setModal({ visible: true, task: null })}
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-floating active:opacity-90"
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>

      <TaskFormModal
        visible={modal.visible}
        task={modal.task}
        onClose={() => setModal({ visible: false, task: null })}
        onSaved={load}
      />
    </SafeAreaView>
  );
}
