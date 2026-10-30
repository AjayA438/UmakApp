const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email) => EMAIL_RE.test(String(email || '').trim().toLowerCase());

/** At least 8 characters, containing a letter and a number. */
export const isStrongPassword = (password) =>
  typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
