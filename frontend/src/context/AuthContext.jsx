import React, { createContext, useState, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('hh_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = (authResponse) => {
    localStorage.setItem('hh_access_token', authResponse.accessToken);
    localStorage.setItem('hh_user', JSON.stringify({
      userId: authResponse.userId,
      username: authResponse.username,
      roles: authResponse.roles,
      emailVerified: authResponse.emailVerified
    }));
    setUser({
      userId: authResponse.userId,
      username: authResponse.username,
      roles: authResponse.roles,
      emailVerified: authResponse.emailVerified
    });
  };

  const login = useCallback(async (usernameOrEmail, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(usernameOrEmail, password);
      if (!result.mfaRequired) {
        persistSession(result);
      }
      return result; // caller checks result.mfaRequired to decide whether to show the OTP step
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeMfaLogin = useCallback(async (userId, code) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifyMfa(userId, code);
      persistSession(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(payload);
      persistSession(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hh_access_token');
    localStorage.removeItem('hh_user');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role) => !!user?.roles?.includes(`ROLE_${role}`),
    [user]
  );

  const markEmailVerified = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, emailVerified: true };
      localStorage.setItem('hh_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, completeMfaLogin, register, logout, hasRole, markEmailVerified }),
    [user, loading, error, login, completeMfaLogin, register, logout, hasRole, markEmailVerified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
