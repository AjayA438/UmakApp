/**
 * ════════════════════════════════════════════════════════════════════
 *  DEV DEMO MODE — in-memory stand-in for PostgreSQL
 * ════════════════════════════════════════════════════════════════════
 * Activated by the `isDemoMode()` check in config/db.js (no usable
 * DATABASE_URL, or DEMO_MODE=true in .env). Every service keeps its SQL
 * path untouched and delegates here instead, so the whole API — auth,
 * tasks, courses, GraphQL, uploads — works with zero infrastructure.
 *
 * Data lives in process memory: it disappears when the server restarts.
 * Set a real Supabase DATABASE_URL and this module is never used.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { notFound } = require('../utils/errors');
const { DAY_NAMES } = require('../utils/validators');

// ── storage ────────────────────────────────────────────────────────
const users = new Map();
const courses = new Map();
const schedules = new Map();
const tasks = new Map();

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

// ── mappers (identical shapes to the SQL rows) ─────────────────────
const mapUser = (u) =>
  u
    ? {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        studentId: u.studentId,
        schoolName: u.schoolName,
        avatarUrl: u.avatarUrl,
        language: u.language,
        createdAt: u.createdAt,
      }
    : null;

const mapCredentials = (u) => (u ? { ...mapUser(u), password_hash: u.passwordHash } : null);

const mapTask = (task) => {
  const course = task.courseId ? courses.get(task.courseId) : null;
  return {
    id: task.id,
    courseId: task.courseId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    course: course ? { id: course.id, name: course.name, color: course.color } : null,
  };
};

const mapCourse = (course) => ({
  id: course.id,
  name: course.name,
  code: course.code,
  instructor: course.instructor,
  room: course.room,
  color: course.color,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
  schedules: [...schedules.values()]
    .filter((slot) => slot.courseId === course.id)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || (a.startTime < b.startTime ? -1 : 1))
    .map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      dayName: DAY_NAMES[slot.dayOfWeek],
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
});

// ── users ──────────────────────────────────────────────────────────
const findPublicById = (id) => mapUser(users.get(id));
const findPublicByEmail = (email) =>
  mapUser([...users.values()].find((u) => u.email === String(email || '').toLowerCase()));
const findCredentialsByEmail = (email) =>
  mapCredentials([...users.values()].find((u) => u.email === String(email || '').toLowerCase()));
const findCredentialsById = (id) => mapCredentials(users.get(id));

const createUser = ({ email, passwordHash, fullName, studentId, schoolName }) => {
  const user = {
    id: uid(),
    email: String(email).toLowerCase(),
    passwordHash,
    fullName,
    studentId: studentId || null,
    schoolName: schoolName || null,
    avatarUrl: null,
    language: 'en',
    resetTokenHash: null,
    resetTokenExpires: null,
    createdAt: now(),
  };
  users.set(user.id, user);
  return mapUser(user);
};

const updateProfile = (id, { fullName, schoolName, language }) => {
  const user = users.get(id);
  if (!user) return null;
  if (fullName != null) user.fullName = fullName;
  if (schoolName != null) user.schoolName = schoolName;
  if (language != null) user.language = language;
  return mapUser(user);
};

const setAvatar = (id, avatarUrl) => {
  const user = users.get(id);
  if (!user) return null;
  user.avatarUrl = avatarUrl;
  return mapUser(user);
};

const setResetToken = (id, hash, expiresAt) => {
  const user = users.get(id);
  if (user) {
    user.resetTokenHash = hash;
    user.resetTokenExpires = expiresAt;
  }
};

const clearResetToken = (id) => {
  const user = users.get(id);
  if (user) {
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
  }
};

const findUserByResetHash = (hash) =>
  mapUser(
    [...users.values()].find((u) => u.resetTokenHash === hash && new Date(u.resetTokenExpires) > new Date())
  );

const updatePassword = (id, passwordHash) => {
  const user = users.get(id);
  if (user) user.passwordHash = passwordHash;
};

const deleteUser = (id) => {
  users.delete(id);
  [...courses.values()].filter((c) => c.userId === id).forEach((c) => deleteCourseRow(c.id));
  [...tasks.values()].filter((t) => t.userId === id).forEach((t) => tasks.delete(t.id));
};

const clearLearningData = (userId) => {
  [...courses.values()].filter((c) => c.userId === userId).forEach((c) => deleteCourseRow(c.id));
  [...tasks.values()].filter((t) => t.userId === userId).forEach((t) => tasks.delete(t.id));
};

const getStats = (userId) => {
  const own = [...tasks.values()].filter((t) => t.userId === userId);
  return {
    pending: own.filter((t) => t.status === 'pending').length,
    done: own.filter((t) => t.status === 'done').length,
    courses: [...courses.values()].filter((c) => c.userId === userId).length,
  };
};

// ── tasks ──────────────────────────────────────────────────────────
const listTasks = (userId, { status } = {}) =>
  [...tasks.values()]
    .filter((t) => t.userId === userId && (!status || t.status === status))
    .sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
      const ad = a.dueDate || '9999-12-31';
      const bd = b.dueDate || '9999-12-31';
      if (ad !== bd) return ad < bd ? -1 : 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    })
    .map(mapTask);

const getTask = (userId, taskId) => {
  const task = tasks.get(taskId);
  if (!task || task.userId !== userId) throw notFound('Task not found.');
  return mapTask(task);
};

const createTask = (userId, payload) => {
  const task = {
    id: uid(),
    userId,
    courseId: payload.courseId || null,
    title: payload.title,
    description: payload.description ?? null,
    dueDate: payload.dueDate || null,
    status: payload.status || 'pending',
    createdAt: now(),
    updatedAt: now(),
  };
  tasks.set(task.id, task);
  return mapTask(task);
};

const updateTask = (userId, taskId, payload) => {
  const task = tasks.get(taskId);
  if (!task || task.userId !== userId) throw notFound('Task not found.');
  if (payload.title != null) task.title = payload.title;
  if (payload.description !== undefined) task.description = payload.description;
  if (payload.dueDate !== undefined) task.dueDate = payload.dueDate;
  if (payload.status != null) task.status = payload.status;
  if (payload.courseId !== undefined) task.courseId = payload.courseId;
  task.updatedAt = now();
  return mapTask(task);
};

const deleteTask = (userId, taskId) => {
  const task = tasks.get(taskId);
  if (!task || task.userId !== userId) throw notFound('Task not found.');
  tasks.delete(taskId);
};

// ── courses + schedules ────────────────────────────────────────────
const listCourses = (userId) =>
  [...courses.values()]
    .filter((c) => c.userId === userId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(mapCourse);

const getCourse = (userId, courseId) => {
  const course = courses.get(courseId);
  if (!course || course.userId !== userId) throw notFound('Course not found.');
  return mapCourse(course);
};

const writeSchedules = (courseId, list) => {
  [...schedules.values()].filter((s) => s.courseId === courseId).forEach((s) => schedules.delete(s.id));
  list.forEach((slot) => {
    const record = { id: uid(), courseId, dayOfWeek: slot.day_of_week, startTime: slot.start_time, endTime: slot.end_time };
    schedules.set(record.id, record);
  });
};

const createCourse = (userId, payload, courseSchedules) => {
  const course = {
    id: uid(),
    userId,
    name: payload.name,
    code: payload.code ?? null,
    instructor: payload.instructor ?? null,
    room: payload.room ?? null,
    color: payload.color || '#14532D',
    createdAt: now(),
    updatedAt: now(),
  };
  courses.set(course.id, course);
  writeSchedules(course.id, courseSchedules);
  return mapCourse(course);
};

const updateCourse = (userId, courseId, payload, courseSchedules) => {
  const course = courses.get(courseId);
  if (!course || course.userId !== userId) throw notFound('Course not found.');
  if (payload.name != null) course.name = payload.name;
  if (payload.code !== undefined) course.code = payload.code;
  if (payload.instructor !== undefined) course.instructor = payload.instructor;
  if (payload.room !== undefined) course.room = payload.room;
  if (payload.color != null) course.color = payload.color;
  if (courseSchedules) writeSchedules(course.id, courseSchedules);
  course.updatedAt = now();
  return mapCourse(course);
};

function deleteCourseRow(courseId) {
  courses.delete(courseId);
  [...schedules.values()].filter((s) => s.courseId === courseId).forEach((s) => schedules.delete(s.id));
  // tasks keep existing but lose the link (ON DELETE SET NULL)
  [...tasks.values()].filter((t) => t.courseId === courseId).forEach((t) => (t.courseId = null));
}

const deleteCourse = (userId, courseId) => {
  const course = courses.get(courseId);
  if (!course || course.userId !== userId) throw notFound('Course not found.');
  deleteCourseRow(courseId);
};

// ── starter data ───────────────────────────────────────────────────
let seeded = false;

function seedDemoData() {
  if (seeded || users.size) return;
  seeded = true;

  const demo = createUser({
    email: 'demo@campus.os',
    passwordHash: bcrypt.hashSync('Campus123', 10),
    fullName: 'Alex Johnson',
    studentId: 'STU-2026-4821',
    schoolName: 'Springfield University',
  });

  const linear = createCourse(demo.id, { name: 'Linear Algebra', code: 'MATH-201', instructor: 'Dr. Ava Chen', room: 'B-104', color: '#14532D' }, [
    { day_of_week: 1, start_time: '09:00', end_time: '10:30' },
    { day_of_week: 3, start_time: '09:00', end_time: '10:30' },
  ]);
  const webdev = createCourse(demo.id, { name: 'Web Development', code: 'CS-118', instructor: 'Prof. Marco Ruiz', room: 'Lab 3', color: '#0E7490' }, [
    { day_of_week: 2, start_time: '11:00', end_time: '12:30' },
    { day_of_week: 4, start_time: '11:00', end_time: '12:30' },
  ]);
  createCourse(demo.id, { name: 'Cognitive Psychology', code: 'PSY-105', instructor: 'Dr. Nora Fields', room: 'A-210', color: '#7C3AED' }, [
    { day_of_week: 1, start_time: '14:00', end_time: '15:30' },
  ]);

  const day = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  createTask(demo.id, { title: 'Finish problem set 4 (Linear Algebra)', description: 'Questions 1–12, chapter 5', dueDate: day(0), status: 'pending', courseId: linear.id });
  createTask(demo.id, { title: 'Submit portfolio draft', description: 'Responsive layout + README', dueDate: day(3), status: 'pending', courseId: webdev.id });
  createTask(demo.id, { title: 'Read chapter 6 — The Design of Everyday Things', dueDate: day(1), status: 'pending' });
  createTask(demo.id, { title: 'Review psychology flashcards', dueDate: day(-1), status: 'done' });
  createTask(demo.id, { title: 'Email professor about office hours', status: 'done' });
}

module.exports = {
  seedDemoData,
  findPublicById,
  findPublicByEmail,
  findCredentialsByEmail,
  findCredentialsById,
  createUser,
  updateProfile,
  setAvatar,
  setResetToken,
  clearResetToken,
  findUserByResetHash,
  updatePassword,
  deleteUser,
  clearLearningData,
  getStats,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
