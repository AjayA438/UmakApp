const bcrypt = require('bcryptjs');

const userService = require('./user.service');
const { query } = require('../config/db');
const { signToken, sha256, generateResetToken } = require('../utils/tokens');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { badRequest, conflict, notFound } = require('../utils/errors');

const SALT_ROUNDS = 10;

/** STU-2026-4821 style id, retried a few times in the unlikely event of a clash. */
async function buildStudentId() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { rows } = await query('select 1 from users where student_id = $1', [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `STU-${year}-${Date.now().toString().slice(-6)}`;
}

async function register({ fullName, email, password, schoolName }) {
  const existing = await userService.findPublicByEmail(email);
  if (existing) throw conflict('An account with that email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const studentId = await buildStudentId();
  const user = await userService.createUser({
    email,
    passwordHash,
    fullName: String(fullName).trim(),
    studentId,
    schoolName: schoolName ? String(schoolName).trim() : null,
  });

  return { user, token: signToken(user) };
}

/** `user` is the credential record from `findCredentials*` (public fields + hash). */
function login(user) {
  const { password_hash, ...safeUser } = user; // never leak the hash to the client
  return { user: safeUser, token: signToken(user) };
}

async function forgotPassword(email) {
  const user = await userService.findPublicByEmail(email);
  // Always answer 200 so the endpoint cannot be used to enumerate accounts.
  if (!user) return { emailed: false };

  const { token, hash } = generateResetToken();
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  await userService.setResetToken(user.id, hash, expires);
  await sendPasswordResetEmail(user.email, token);

  return { emailed: true };
}

async function resetPassword({ token, password }) {
  if (!token) throw badRequest('Reset token is required.');
  const user = await userService.findUserByResetHash(sha256(token));
  if (!user) throw notFound('This reset link is invalid or has expired. Please request a new one.');

  await userService.updatePassword(user.id, await bcrypt.hash(password, SALT_ROUNDS));
  await userService.clearResetToken(user.id);
  return { ok: true };
}

module.exports = { register, login, forgotPassword, resetPassword };
