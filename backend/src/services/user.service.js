const { query, isDemoMode } = require('../config/db');
const memory = require('../db/memory');
const { normalizeEmail } = require('../utils/validators');

// When no database is configured, every function below delegates to the
// in-memory dev store (db/memory.js) and returns an identical shape.

const PUBLIC_COLUMNS = 'id, email, full_name, student_id, school_name, avatar_url, language, created_at';

const mapUser = (row) =>
  row
    ? {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        studentId: row.student_id,
        schoolName: row.school_name,
        avatarUrl: row.avatar_url,
        language: row.language,
        createdAt: row.created_at,
      }
    : null;

/** Same public shape plus the bcrypt hash — internal use only. */
const mapCredentialsRow = (row) => (row ? { ...mapUser(row), password_hash: row.password_hash } : null);

const findPublicById = async (id) => {
  if (isDemoMode()) return memory.findPublicById(id);
  const { rows } = await query(`select ${PUBLIC_COLUMNS} from users where id = $1`, [id]);
  return mapUser(rows[0]);
};

const findPublicByEmail = async (email) => {
  if (isDemoMode()) return memory.findPublicByEmail(email);
  const { rows } = await query(`select ${PUBLIC_COLUMNS} from users where lower(email) = $1`, [normalizeEmail(email)]);
  return mapUser(rows[0]);
};

/** Includes password_hash — only ever used by the Passport local strategy. */
const findCredentialsByEmail = async (email) => {
  if (isDemoMode()) return memory.findCredentialsByEmail(email);
  const { rows } = await query(`select ${PUBLIC_COLUMNS}, password_hash from users where lower(email) = $1`, [normalizeEmail(email)]);
  return mapCredentialsRow(rows[0]);
};

const findCredentialsById = async (id) => {
  if (isDemoMode()) return memory.findCredentialsById(id);
  const { rows } = await query(`select ${PUBLIC_COLUMNS}, password_hash from users where id = $1`, [id]);
  return mapCredentialsRow(rows[0]);
};

const createUser = async ({ email, passwordHash, fullName, studentId, schoolName }) => {
  if (isDemoMode()) return memory.createUser({ email, passwordHash, fullName, studentId, schoolName });
  const { rows } = await query(
    `insert into users (email, password_hash, full_name, student_id, school_name)
     values ($1, $2, $3, $4, $5)
     returning ${PUBLIC_COLUMNS}`,
    [normalizeEmail(email), passwordHash, fullName, studentId, schoolName || null]
  );
  return mapUser(rows[0]);
};

const updateProfile = async (id, { fullName, schoolName, language }) => {
  if (isDemoMode()) return memory.updateProfile(id, { fullName, schoolName, language });
  const { rows } = await query(
    `update users
        set full_name   = coalesce($2, full_name),
            school_name = coalesce($3, school_name),
            language    = coalesce($4, language),
            updated_at  = now()
      where id = $1
      returning ${PUBLIC_COLUMNS}`,
    [id, fullName ?? null, schoolName ?? null, language ?? null]
  );
  return mapUser(rows[0]);
};

const setAvatar = async (id, avatarUrl) => {
  if (isDemoMode()) return memory.setAvatar(id, avatarUrl);
  const { rows } = await query(
    `update users set avatar_url = $2, updated_at = now() where id = $1 returning ${PUBLIC_COLUMNS}`,
    [id, avatarUrl]
  );
  return mapUser(rows[0]);
};

const setResetToken = (id, hash, expiresAt) => {
  if (isDemoMode()) return memory.setResetToken(id, hash, expiresAt);
  return query('update users set reset_token_hash = $2, reset_token_expires = $3, updated_at = now() where id = $1', [id, hash, expiresAt]);
};

const clearResetToken = (id) => {
  if (isDemoMode()) return memory.clearResetToken(id);
  return query('update users set reset_token_hash = null, reset_token_expires = null, updated_at = now() where id = $1', [id]);
};

const findUserByResetHash = async (hash) => {
  if (isDemoMode()) return memory.findUserByResetHash(hash);
  const { rows } = await query(
    `select ${PUBLIC_COLUMNS} from users where reset_token_hash = $1 and reset_token_expires > now()`,
    [hash]
  );
  return mapUser(rows[0]);
};

const updatePassword = (id, passwordHash) => {
  if (isDemoMode()) return memory.updatePassword(id, passwordHash);
  return query('update users set password_hash = $2, updated_at = now() where id = $1', [id, passwordHash]);
};

const deleteUser = (id) => {
  if (isDemoMode()) return memory.deleteUser(id);
  return query('delete from users where id = $1', [id]);
};

/** "Reset account": wipes tasks, courses and schedules but keeps the login. */
const clearLearningData = (id) => {
  if (isDemoMode()) return memory.clearLearningData(id);
  return query('delete from courses where user_id = $1', [id]).then(() => query('delete from tasks where user_id = $1', [id]));
};

const getStats = async (id) => {
  if (isDemoMode()) return memory.getStats(id);
  const { rows } = await query(
    `select
       count(*) filter (where t.status = 'pending')::int as pending,
       count(*) filter (where t.status = 'done')::int    as done,
       (select count(*) from courses c where c.user_id = $1)::int as courses
     from tasks t
     where t.user_id = $1`,
    [id]
  );
  return rows[0];
};

module.exports = {
  mapUser,
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
};
