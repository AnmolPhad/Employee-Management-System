import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import {
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
} from '../utils/auth';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getStoredToken());
  const [user, setUserState] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Source of truth: verify session with backend /api/auth/me
        const response = await authApi.getMe();
        if (response && response.success && response.data) {
          setUserState(response.data);
          setStoredUser(response.data);
        } else {
          clearAuth();
          setTokenState(null);
          setUserState(null);
        }
      } catch (err) {
        // Token invalid or expired
        clearAuth();
        setTokenState(null);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'Login failed. Please check credentials.');
      }

      const { token: jwtToken, user: initialUser } = response.data;

      // Store JWT token
      setStoredToken(jwtToken);
      setTokenState(jwtToken);

      // Fetch fresh /api/auth/me as requested
      try {
        const meResponse = await authApi.getMe();
        if (meResponse && meResponse.success && meResponse.data) {
          setUserState(meResponse.data);
          setStoredUser(meResponse.data);
        } else {
          setUserState(initialUser);
          setStoredUser(initialUser);
        }
      } catch {
        setUserState(initialUser);
        setStoredUser(initialUser);
      }

      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  }, []);

  const hasRole = useCallback(
    (roleName) => {
      if (!user) return false;
      const target = (roleName || '').toLowerCase();
      if (user.role && user.role.toLowerCase() === target) return true;
      if (Array.isArray(user.roles)) {
        return user.roles.some((r) => r.toLowerCase() === target);
      }
      return false;
    },
    [user]
  );

  const isAdmin = hasRole(ROLES.ADMIN);
  const isHR = hasRole(ROLES.HR);
  const isManager = hasRole(ROLES.MANAGER);
  const isEmployee = hasRole(ROLES.EMPLOYEE);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isHR,
    isManager,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
