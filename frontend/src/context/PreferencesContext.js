import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { translations, LANGUAGES } from '../i18n/translations';
import api from '../api';

const LANGUAGE_KEY = 'campusos.language';

const PreferencesContext = createContext(null);

/**
 * Holds the app language chosen in Settings.
 * The pick is stored on the device, mirrored to the user record on the API
 * when signed in, and used by `t()` for the UI dictionary.
 */
export function PreferencesProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && translations[stored]) setLanguageState(stored);
    });
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
    // Best effort — the app stays usable in offline mode.
    api.user.updateProfile({ language: code }).catch(() => {});
  }, []);

  const t = useCallback(
    (key) => translations[language]?.[key] ?? translations.en[key] ?? key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t, languages: LANGUAGES }), [language, setLanguage, t]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('useI18n must be used inside <PreferencesProvider>');
  return context;
};
