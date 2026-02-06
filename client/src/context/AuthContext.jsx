import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from '../services/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const avatar = localStorage.getItem('avatar');
    return token ? { token, role, name, email, avatar } : null;
  });

  const logoutTimerRef = useRef(null);
  const axiosInterceptorRef = useRef(null);
  const axiosRequestInterceptorRef = useRef(null);

  const parseJwtExpMs = (token) => {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      const expSec = payload?.exp;
      if (typeof expSec !== 'number') return null;
      return expSec * 1000;
    } catch {
      return null;
    }
  };

  const login = useCallback((tokenOrData, role, name, email, avatar = null) => {
    const normalized = (() => {
      if (tokenOrData && typeof tokenOrData === 'object') {
        const data = tokenOrData;
        const token = data.token;
        const derivedRole = data.role;
        const derivedName = data.name || data.username || data.email;
        const derivedEmail = data.email;
        const derivedAvatar = data.avatar ?? null;
        return { token, role: derivedRole, name: derivedName, email: derivedEmail, avatar: derivedAvatar };
      }
      return { token: tokenOrData, role, name, email, avatar };
    })();

    if (!normalized?.token) {
      return;
    }

    localStorage.setItem('token', normalized.token);
    if (normalized.role != null) localStorage.setItem('role', normalized.role);
    if (normalized.name != null) localStorage.setItem('name', normalized.name);
    if (normalized.email != null) localStorage.setItem('email', normalized.email);
    if (normalized.avatar) localStorage.setItem('avatar', normalized.avatar);

    localStorage.setItem('user', JSON.stringify(normalized));
    setAuth(normalized);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('avatar');
    localStorage.removeItem('user');
    setAuth(null);
  }, []);

  useEffect(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    const token = auth?.token;
    const expMs = parseJwtExpMs(token);
    if (!token || !expMs) return;

    const now = Date.now();
    const msUntilExpiry = expMs - now;
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, msUntilExpiry);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [auth?.token, logout]);

  useEffect(() => {
    if (axiosInterceptorRef.current != null) return;

    axiosRequestInterceptorRef.current = axios.interceptors.request.use(
      (config) => {
        const token = auth?.token || localStorage.getItem('token');
        if (token && !config?.headers?.Authorization) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axiosInterceptorRef.current = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (axiosRequestInterceptorRef.current != null) {
        axios.interceptors.request.eject(axiosRequestInterceptorRef.current);
        axiosRequestInterceptorRef.current = null;
      }
      if (axiosInterceptorRef.current != null) {
        axios.interceptors.response.eject(axiosInterceptorRef.current);
        axiosInterceptorRef.current = null;
      }
    };
  }, [logout]);

  useEffect(() => {
    const token = auth?.token;
    const role = auth?.role;
    if (!token || !role) return;

    const endpoint = (() => {
      switch (role) {
        case 'STUDENT':
          return '/student/profile';
        case 'RECRUITER':
          return '/recruiter/profile';
        case 'ADMIN':
          return '/admin/profile';
        default:
          return null;
      }
    })();

    if (!endpoint) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(endpoint);
        const profilePictureUrl = res?.data?.profilePictureUrl;
        if (!cancelled && profilePictureUrl && profilePictureUrl !== auth?.avatar) {
          localStorage.setItem('avatar', profilePictureUrl);
          setAuth((prev) => {
            if (!prev) return prev;
            const next = { ...prev, avatar: profilePictureUrl };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
          });
        }
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, auth?.role]);

  const updateAvatar = (avatar) => {
    if (!avatar) {
      localStorage.removeItem('avatar');
      setAuth(prev => {
        if (!prev) return prev;
        const next = { ...prev, avatar: null };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
      return;
    }
    localStorage.setItem('avatar', avatar);
    setAuth(prev => {
      if (!prev) return prev;
      const next = { ...prev, avatar };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, user: auth, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
