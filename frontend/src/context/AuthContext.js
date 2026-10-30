import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api, { TOKEN_KEY, setUnauthorizedHandler } from '../api';

const AuthContext = createContext(null);

/** Wraps the API and keeps the JWT + student profile in memory + storage. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const signOut = useCallback(async (notify = false) => {
    if (notify) await api.auth.logout().catch(() => {}); // best effort, while the token is still attached
    await AsyncStorage.removeItem(TOKEN_KEY);
    if (mounted.current) setUser(null);
  }, []);

  // Any 401 from the API silently ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut(false));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Restore the session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const data = await api.auth.me();
          if (mounted.current) setUser(data.user);
        }
      } catch (error) {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        if (mounted.current) setBooting(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await api.auth.login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (payload) => {
    const data = await api.auth.signup(payload);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /** Merges a fresh server-side user object into the local state. */
  const updateUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...(typeof patch === 'function' ? patch(current) : patch) } : current));
  }, []);

  const value = useMemo(
    () => ({ user, booting, signIn, signUp, signOut, updateUser }),
    [user, booting, signIn, signUp, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
