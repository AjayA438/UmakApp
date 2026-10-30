import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ListChecks, GraduationCap, User } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useI18n } from '../context/PreferencesContext';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: House,
  Tasks: ListChecks,
  Courses: GraduationCap,
  Profile: User,
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#14532D',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 6 : 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2EDE4',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...Platform.select({
            ios: { shadowColor: '#14532D', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
            android: { elevation: 16 },
          }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const Icon = ICONS[route.name];
          return (
            <View
              className={`items-center justify-center ${focused ? 'bg-primary-100' : 'bg-transparent'}`}
              style={{ width: 44, height: 30, borderRadius: 15 }}
            >
              <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarLabel: t('tasks') }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarLabel: t('courses') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile') }} />
    </Tab.Navigator>
  );
}
