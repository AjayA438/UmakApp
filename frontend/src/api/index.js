import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../constants/config';

export const TOKEN_KEY = 'campusos.token';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request.
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
/** Registered by AuthContext so a 401 anywhere signs the user out. */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof onUnauthorized === 'function') onUnauthorized();
    return Promise.reject(error);
  }
);

/** Human-friendly message for any Axios error. */
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

const api = {
  auth: {
    signup: (payload) => client.post('/auth/signup', payload).then((r) => r.data),
    login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data),
    me: () => client.get('/auth/me').then((r) => r.data),
    forgotPassword: (email) => client.post('/auth/forgot-password', { email }).then((r) => r.data),
    resetPassword: (token, password) => client.post('/auth/reset-password', { token, password }).then((r) => r.data),
  },
  tasks: {
    list: (params) => client.get('/tasks', { params }).then((r) => r.data.tasks),
    create: (payload) => client.post('/tasks', payload).then((r) => r.data.task),
    update: (id, payload) => client.patch(`/tasks/${id}`, payload).then((r) => r.data.task),
    remove: (id) => client.delete(`/tasks/${id}`).then((r) => r.data),
  },
  courses: {
    list: () => client.get('/courses').then((r) => r.data.courses),
    create: (payload) => client.post('/courses', payload).then((r) => r.data.course),
    update: (id, payload) => client.patch(`/courses/${id}`, payload).then((r) => r.data.course),
    remove: (id) => client.delete(`/courses/${id}`).then((r) => r.data),
  },
  user: {
    updateProfile: (payload) => client.patch('/user/profile', payload).then((r) => r.data),
    stats: () => client.get('/user/stats').then((r) => r.data.stats),
    uploadAvatar: (formData) =>
      client.post('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
    resetAccount: () => client.post('/user/reset-account').then((r) => r.data),
    deleteAccount: () => client.delete('/user/account').then((r) => r.data),
  },
  contact: {
    send: (payload) => client.post('/contact', payload).then((r) => r.data),
  },
};

export default api;
