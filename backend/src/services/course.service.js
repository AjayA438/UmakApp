const { query, withTransaction, isDemoMode } = require('../config/db');
const memory = require('../db/memory');
const { notFound, badRequest } = require('../utils/errors');
const { DAY_NAMES } = require('../utils/validators');

const COURSE_COLUMNS = 'id, user_id, name, code, instructor, room, color, created_at, updated_at';

const mapCourse = (row, schedules = []) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  instructor: row.instructor,
  room: row.room,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  schedules: schedules.map((s) => ({
    id: s.id,
    dayOfWeek: s.day_of_week,
    dayName: DAY_NAMES[s.day_of_week],
    startTime: s.start_time,
    endTime: s.end_time,
  })),
});

async function listSchedules(courseIds) {
  if (!courseIds.length) return new Map();
  const { rows } = await query(
    `select id, course_id, day_of_week,
            to_char(start_time, 'HH24:MI') as start_time,
            to_char(end_time,   'HH24:MI') as end_time
       from schedules
      where course_id = any($1::uuid[])
      order by day_of_week, start_time`,
    [courseIds]
  );
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.course_id)) map.set(row.course_id, []);
    map.get(row.course_id).push(row);
  });
  return map;
}

async function list(userId) {
  if (isDemoMode()) return memory.listCourses(userId);
  const { rows } = await query(`select ${COURSE_COLUMNS} from courses where user_id = $1 order by name asc`, [userId]);
  const scheduleMap = await listSchedules(rows.map((r) => r.id));
  return rows.map((row) => mapCourse(row, scheduleMap.get(row.id) || []));
}

async function get(userId, id) {
  if (isDemoMode()) return memory.getCourse(userId, id);
  const { rows } = await query(`select ${COURSE_COLUMNS} from courses where id = $2 and user_id = $1`, [userId, id]);
  if (!rows[0]) throw notFound('Course not found.');
  const scheduleMap = await listSchedules([id]);
  return mapCourse(rows[0], scheduleMap.get(id) || []);
}

async function create(userId, data) {
  const payload = validateCourse(data, { requireName: true });
  const schedules = validateSchedules(data.schedules);
  if (isDemoMode()) return memory.createCourse(userId, payload, schedules);

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into courses (user_id, name, code, instructor, room, color)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [userId, payload.name, payload.code, payload.instructor, payload.room, payload.color]
    );
    const courseId = rows[0].id;
    await insertSchedules(client, courseId, schedules);
    return get(userId, courseId);
  });
}

async function update(userId, id, data) {
  const payload = validateCourse(data, { requireName: false });
  const schedules = data.schedules === undefined ? null : validateSchedules(data.schedules);
  if (isDemoMode()) return memory.updateCourse(userId, id, payload, schedules);

  await withTransaction(async (client) => {
    const { rowCount } = await client.query(
      `update courses
          set name       = coalesce($3, name),
              code       = coalesce($4, code),
              instructor = coalesce($5, instructor),
              room       = coalesce($6, room),
              color      = coalesce($7, color),
              updated_at = now()
        where id = $2 and user_id = $1`,
      [userId, id, payload.name ?? null, payload.code ?? null, payload.instructor ?? null, payload.room ?? null, payload.color ?? null]
    );
    if (!rowCount) throw notFound('Course not found.');

    // The schedule list is replaced wholesale so the modal can add/remove rows.
    if (schedules) {
      await client.query('delete from schedules where course_id = $1', [id]);
      await insertSchedules(client, id, schedules);
    }
  });

  return get(userId, id);
}

async function remove(userId, id) {
  if (isDemoMode()) {
    memory.deleteCourse(userId, id);
    return { id, deleted: true };
  }
  const { rowCount } = await query('delete from courses where id = $2 and user_id = $1', [userId, id]);
  if (!rowCount) throw notFound('Course not found.');
  return { id, deleted: true };
}

async function insertSchedules(client, courseId, schedules) {
  for (const s of schedules) {
    await client.query(
      'insert into schedules (course_id, day_of_week, start_time, end_time) values ($1, $2, $3, $4)',
      [courseId, s.day_of_week, s.start_time, s.end_time]
    );
  }
}

function validateCourse(data = {}, { requireName }) {
  const name = data.name === undefined ? undefined : String(data.name || '').trim();
  if (requireName && !name) throw badRequest('Course name is required.');

  const color = data.color === undefined ? undefined : String(data.color || '').trim();
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) throw badRequest('Colour must be a hex value like #14532D.');

  return {
    name,
    code: data.code === undefined ? undefined : String(data.code || '').trim() || null,
    instructor: data.instructor === undefined ? undefined : String(data.instructor || '').trim() || null,
    room: data.room === undefined ? undefined : String(data.room || '').trim() || null,
    color,
  };
}

function validateSchedules(schedules) {
  if (schedules == null) return [];
  if (!Array.isArray(schedules)) throw badRequest('schedules must be an array.');
  return schedules;
}

module.exports = { list, get, create, update, remove, mapCourse };
