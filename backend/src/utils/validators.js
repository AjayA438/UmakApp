const { badRequest } = require('./errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidEmail = (email) => EMAIL_RE.test(normalizeEmail(email));

/** At least 8 chars with a letter and a number. */
const isStrongPassword = (password) => typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

const isValidDate = (value) => DATE_RE.test(String(value || '')) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

function validateSignup({ email, password, fullName }) {
  const errors = {};
  if (!fullName || String(fullName).trim().length < 2) errors.fullName = 'Please enter your full name.';
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!isStrongPassword(password)) errors.password = 'Password must be at least 8 characters and contain a letter and a number.';
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);
}

function validateLogin({ email, password }) {
  const errors = {};
  if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);
}

/**
 * Validates the schedule rows sent by the client and normalises them to
 * { day_of_week, start_time, end_time }.
 */
function normalizeSchedules(schedules) {
  if (schedules == null) return [];
  if (!Array.isArray(schedules)) throw badRequest('schedules must be an array.');

  return schedules.map((item, index) => {
    const day = Number(item?.day_of_week);
    const start = String(item?.start_time || '').slice(0, 5);
    const end = String(item?.end_time || '').slice(0, 5);

    if (!Number.isInteger(day) || day < 0 || day > 6) throw badRequest(`Schedule #${index + 1}: invalid day.`);
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) throw badRequest(`Schedule #${index + 1}: times must look like 09:00.`);
    if (end <= start) throw badRequest(`Schedule #${index + 1}: end time must be after start time.`);

    return { day_of_week: day, start_time: start, end_time: end };
  });
}

module.exports = {
  DAY_NAMES,
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
  isValidDate,
  isValidTime: (value) => TIME_RE.test(String(value || '')),
  validateSignup,
  validateLogin,
  normalizeSchedules,
};
