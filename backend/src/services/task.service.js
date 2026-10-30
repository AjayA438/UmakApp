const { query, withTransaction, isDemoMode } = require('../config/db');
const memory = require('../db/memory');
const { notFound, badRequest } = require('../utils/errors');
const { isValidDate } = require('../utils/validators');

const SELECT_TASK = `
  select t.id, t.user_id, t.course_id, t.title, t.description,
         to_char(t.due_date, 'YYYY-MM-DD') as due_date,
         t.status, t.created_at, t.updated_at,
         c.name  as course_name,
         c.color as course_color
    from tasks t
    left join courses c on c.id = t.course_id`;

const mapTask = (row) => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description,
  dueDate: row.due_date,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  course: row.course_id ? { id: row.course_id, name: row.course_name, color: row.course_color } : null,
});

async function list(userId, { status } = {}) {
  if (status && !['pending', 'done'].includes(status)) throw badRequest('status must be "pending" or "done".');
  if (isDemoMode()) return memory.listTasks(userId, { status });
  const { rows } = await query(
    `${SELECT_TASK}
      where t.user_id = $1 and ($2::text is null or t.status = $2)
      order by (t.status = 'done') asc, t.due_date asc nulls last, t.created_at desc`,
    [userId, status || null]
  );
  return rows.map(mapTask);
}

async function get(userId, id) {
  if (isDemoMode()) return memory.getTask(userId, id);
  const { rows } = await query(`${SELECT_TASK} where t.id = $2 and t.user_id = $1`, [userId, id]);
  if (!rows[0]) throw notFound('Task not found.');
  return mapTask(rows[0]);
}

async function create(userId, data) {
  const { title, description, dueDate, status, courseId } = validatePayload(data, { requireTitle: true });
  if (isDemoMode()) return memory.createTask(userId, { title, description, dueDate, status, courseId });
  const { rows } = await query(
    `insert into tasks (user_id, course_id, title, description, due_date, status)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [userId, courseId || null, title, description || null, dueDate || null, status]
  );
  return get(userId, rows[0].id);
}

async function update(userId, id, data) {
  const { title, description, dueDate, status, courseId } = validatePayload(data, { requireTitle: false });
  if (isDemoMode()) return memory.updateTask(userId, id, { title, description, dueDate, status, courseId });
  await withTransaction(async (client) => {
    const { rowCount } = await client.query(
      `update tasks
          set title       = coalesce($3, title),
              description = case when $4::boolean then $5 else description end,
              due_date    = case when $6::boolean then $7::date else due_date end,
              status      = coalesce($8, status),
              course_id   = case when $9::boolean then $10::uuid else course_id end,
              updated_at  = now()
        where id = $2 and user_id = $1`,
      [
        userId,
        id,
        title ?? null,
        data.description !== undefined,
        data.description ?? null,
        data.dueDate !== undefined,
        dueDate,
        status ?? null,
        data.courseId !== undefined,
        courseId,
      ]
    );
    if (!rowCount) throw notFound('Task not found.');
  });

  return get(userId, id);
}

async function remove(userId, id) {
  if (isDemoMode()) {
    memory.deleteTask(userId, id);
    return { id, deleted: true };
  }
  const { rowCount } = await query('delete from tasks where id = $2 and user_id = $1', [userId, id]);
  if (!rowCount) throw notFound('Task not found.');
  return { id, deleted: true };
}

function validatePayload(data = {}, { requireTitle }) {
  const title = data.title === undefined ? undefined : String(data.title || '').trim();
  if (requireTitle && !title) throw badRequest('Task title is required.');

  const status = data.status === undefined ? undefined : data.status;
  if (status && !['pending', 'done'].includes(status)) throw badRequest('status must be "pending" or "done".');

  const dueDate = data.dueDate === undefined ? undefined : data.dueDate;
  if (dueDate && dueDate !== null && !isValidDate(dueDate)) throw badRequest('Due date must be formatted YYYY-MM-DD.');

  if (requireTitle && title.length < 2) throw badRequest('Task title is too short.');

  return { title, description: data.description, dueDate, status, courseId: data.courseId };
}

module.exports = { list, get, create, update, remove, mapTask };
