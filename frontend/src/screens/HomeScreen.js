import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Plus, BookOpen, ClipboardList, Settings, Check, ChevronRight, ListTodo } from 'lucide-react-native';

import AppHeader from '../components/AppHeader';
import TaskRow from '../components/TaskRow';
import EmptyState from '../components/EmptyState';
import TaskFormModal from '../components/TaskFormModal';
import CourseFormModal from '../components/CourseFormModal';
import Loader from '../components/Loader';

import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/PreferencesContext';
import api, { errorMessage } from '../api';
import { toast } from '../utils/notify';
import { greeting, formatDateLong, formatTime } from '../utils/dates';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useI18n();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskModal, setTaskModal] = useState({ visible: false, task: null });
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock for the welcome card.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    try {
      const pending = await api.tasks.list({ status: 'pending' });
      setTasks(pending);
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const markDone = async (task) => {
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id)); // optimistic
    try {
      await api.tasks.update(task.id, { status: 'done' });
      toast.success(t('done'), task.title);
    } catch (error) {
      setTasks(previous);
      toast.error('Could not update the task', errorMessage(error));
    }
  };

  const quickActions = [
    { label: t('addTask'), icon: Plus, onPress: () => setTaskModal({ visible: true, task: null }) },
    { label: t('addCourse'), icon: BookOpen, onPress: () => setCourseModalVisible(true) },
    { label: t('myCourses'), icon: ClipboardList, onPress: () => navigation.navigate('Courses') },
    { label: t('settings'), icon: Settings, onPress: () => navigation.navigate('Settings') },
  ];

  if (loading) return <Loader label="Loading your campus…" />;

  const firstName = (user?.fullName || 'Student').split(' ')[0];

  return (
    <View className="flex-1 bg-tint">
      <AppHeader
        notificationCount={tasks.length}
        onPressBell={() => navigation.navigate('Tasks')}
        onPressProfile={() => navigation.navigate('Profile')}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-8 pt-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14532D" />}
      >
        {/* ── Welcome card ─────────────────────────────── */}
        <LinearGradient
          colors={['#14532D', '#2A6540']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className=" overflow-hidden rounded-3xl p-5 shadow-soft"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={14} color="#BAD7BF" />
                <Text className="font-inter-medium text-[12.5px] text-primary-100">{greeting(now)}</Text>
              </View>
              <Text className="mt-1 font-inter-bold text-[22px] leading-7 text-white">{firstName} 👋</Text>
              <Text className="mt-1.5 text-[12.5px] text-primary-100">
                {formatDateLong(now)} · {formatTime(now)}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/12 px-3.5 py-2.5">
            <Text className="font-inter-medium text-[12.5px] text-primary-100">{t('studentId')}</Text>
            <Text className="font-inter-bold text-[13px] tracking-wide text-white">{user?.studentId || '—'}</Text>
          </View>
        </LinearGradient>

        {/* ── Quick actions ────────────────────────────── */}
        <View>
          <Text className="mb-3 font-inter-semibold text-[15px] text-ink">{t('whatToday')}</Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                className="w-[47%] flex-row items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-4 shadow-card active:opacity-80"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                  <action.icon size={17} color="#14532D" />
                </View>
                <Text className="flex-1 font-inter-medium text-[13px] leading-4 text-ink">{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Pending tasks ────────────────────────────── */}
        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-inter-semibold text-[15px] text-ink">{t('pendingTasks')}</Text>
            {tasks.length ? (
              <Pressable onPress={() => navigation.navigate('Tasks')} className="flex-row items-center gap-0.5 active:opacity-70">
                <Text className="font-inter-medium text-[13px] text-primary-600">{t('seeAll')}</Text>
                <ChevronRight size={15} color="#2A6540" />
              </Pressable>
            ) : null}
          </View>

          {tasks.length ? (
            <View className="gap-2.5">
              {tasks.slice(0, 6).map((task) => (
                <TaskRow key={task.id} task={task} onToggle={markDone} />
              ))}
            </View>
          ) : (
            <EmptyState icon={Check} title={t('allDone')} subtitle={t('allDoneHint')}>
              <Pressable
                onPress={() => setTaskModal({ visible: true, task: null })}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3 active:opacity-80"
              >
                <Plus size={16} color="#FFFFFF" />
                <Text className="font-inter-semibold text-[13.5px] text-white">{t('addTask')}</Text>
              </Pressable>
            </EmptyState>
          )}

          {tasks.length > 6 ? (
            <Pressable
              onPress={() => navigation.navigate('Tasks')}
              className="mt-3 flex-row items-center justify-center gap-1.5 rounded-2xl border border-line bg-white py-3 active:opacity-80"
            >
              <ListTodo size={15} color="#2A6540" />
              <Text className="font-inter-medium text-[13px] text-primary-600">
                {t('seeAll')} ({tasks.length})
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <TaskFormModal
        visible={taskModal.visible}
        task={taskModal.task}
        onClose={() => setTaskModal({ visible: false, task: null })}
        onSaved={load}
      />
      <CourseFormModal visible={courseModalVisible} onClose={() => setCourseModalVisible(false)} onSaved={load} />
    </View>
  );
}
