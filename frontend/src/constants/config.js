/**
 * Where the API lives. Set EXPO_PUBLIC_API_URL in frontend/.env —
 * see .env.example for the value to use on emulators vs. real devices.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const APP_NAME = 'Campus OS';

/** The API returns relative media paths (`/uploads/x.jpg`) — make them absolute. */
export const resolveMediaUrl = (url) => {
  if (!url || url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

/** Used by the "Rate us" and "Share this app" rows in Settings. */
export const STORE_URL = {
  android: 'https://play.google.com/store/apps/details?id=app.campusos.mobile',
  ios: 'https://apps.apple.com/app/campus-os/id0000000000',
};

export const LEGAL_URLS = {
  privacy: 'https://campusos.app/privacy',
  terms: 'https://campusos.app/terms',
};
