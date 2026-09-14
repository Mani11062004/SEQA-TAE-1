import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('secureshield_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('secureshield_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token & user from server on load
  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          localStorage.setItem('secureshield_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          logout();
        }
      } else {
        // Automatically default to demo admin on fresh session for easiest viva demonstration!
        try {
          const demoRes = await api.demoLogin('admin');
          setToken(demoRes.token);
          setUser(demoRes.user);
          localStorage.setItem('secureshield_token', demoRes.token);
          localStorage.setItem('secureshield_user', JSON.stringify(demoRes.user));
        } catch (demoErr) {
          console.error('Could not auto-login demo admin:', demoErr);
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await api.login({ emailOrUsername, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('secureshield_token', res.token);
    localStorage.setItem('secureshield_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('secureshield_token', res.token);
    localStorage.setItem('secureshield_user', JSON.stringify(res.user));
    return res;
  };

  const switchDemoRole = async (role) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('secureshield_token', res.token);
      localStorage.setItem('secureshield_user', JSON.stringify(res.user));
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('secureshield_token');
    localStorage.removeItem('secureshield_user');
  };

  const isAdmin = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer';
  const isDeveloper = user?.role === 'developer';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      switchDemoRole,
      logout,
      isAdmin,
      isReviewer,
      isDeveloper
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
