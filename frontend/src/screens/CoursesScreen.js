import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Plus, BookOpen, CalendarDays } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CourseCard from '../components/CourseCard';
import EmptyState from '../components/EmptyState';
import CourseFormModal from '../components/CourseFormModal';

import { useI18n } from '../context/PreferencesContext';
import api, { errorMessage } from '../api';
import { toast, confirmAction } from '../utils/notify';
import { DAY_SHORT } from '../utils/dates';

/** Builds a compact "today / next class" summary from every course schedule. */
function todaySummary(courses) {
  const today = new Date().getDay();
  return courses.flatMap((course) =>
    (course.schedules || []).filter((slot) => slot.dayOfWeek === today).map((slot) => ({ course, slot }))
  );
}

export default function CoursesScreen() {
  const { t } = useI18n();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState({ visible: false, course: null });

  const load = useCallback(async () => {
    try {
      setCourses(await api.courses.list());
    } catch (error) {
      toast.error(t('courses'), errorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (course) =>
    confirmAction(
      t('delete'),
      `Delete "${course.name}" and its schedule? Its tasks will be kept.`,
      async () => {
        try {
          await api.courses.remove(course.id);
          setCourses((current) => current.filter((item) => item.id !== course.id));
          toast.success(t('delete'), 'Course deleted.');
        } catch (error) {
          toast.error('Could not delete the course', errorMessage(error));
        }
      },
      { confirmLabel: t('delete'), destructive: true }
    );

  const todays = todaySummary(courses);

  return (
    <SafeAreaView className="flex-1 bg-tint">
      <View className="border-b border-line bg-white px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-inter-bold text-[22px] text-ink">{t('courses')}</Text>
            <Text className="mt-0.5 text-[12.5px] text-muted">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </Text>
          </View>

          <Pressable
            onPress={() => setModal({ visible: true, course: null })}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerClassName="grow gap-3 px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListHeaderComponent={
          todays.length ? (
            <View className="mb-1 rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <View className="mb-2 flex-row items-center gap-1.5">
                <CalendarDays size={15} color="#2A6540" />
                <Text className="font-inter-semibold text-[13.5px] text-primary-700">
                  Today · {DAY_SHORT[new Date().getDay()]}
                </Text>
              </View>
              <View className="gap-1.5">
                {todays.map(({ course, slot }) => (
                  <Text key={`${course.id}-${slot.id}`} className="text-[12.5px] text-primary-600">
                    {slot.startTime}–{slot.endTime} · {course.name}
                    {course.room ? ` (${course.room})` : ''}
                  </Text>
                ))}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="pt-6">
              <EmptyState icon={BookOpen} title={t('noCourses')} subtitle={t('noCoursesHint')} />
            </View>
          )
        }
        renderItem={({ item }) => (
          <CourseCard course={item} onEdit={(course) => setModal({ visible: true, course })} onDelete={remove} />
        )}
      />

      <Pressable
        onPress={() => setModal({ visible: true, course: null })}
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-floating active:opacity-90"
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>

      <CourseFormModal
        visible={modal.visible}
        course={modal.course}
        onClose={() => setModal({ visible: false, course: null })}
        onSaved={load}
      />
    </SafeAreaView>
  );
}
