export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses YYYY-MM-DD as a *local* date (avoids the UTC off-by-one). */
export const parseDate = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && Boolean(parseDate(value));

export const formatDateLong = (date) =>
  `${DAY_NAMES[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;

export const formatTime = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** "09:00" → "9:00 AM" */
export const formatClockTime = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Friendly due-date label used across Home and Tasks:
 * "Overdue", "Today", "Tomorrow", or "Oct 30".
 */
export const dueLabel = (iso) => {
  const due = parseDate(iso);
  if (!due) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((due - startOfToday) / 86400000);

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${MONTHS[due.getMonth()]} ${due.getDate()}`;
};

export const isOverdue = (iso, status) => {
  const due = parseDate(iso);
  if (!due || status === 'done') return false;
  const today = new Date();
  return due < new Date(today.getFullYear(), today.getMonth(), today.getDate());
};
