import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from '../services/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimerRef = useRef(null);
  const axiosInterceptorRef = useRef(null);
  const axiosRequestInterceptorRef = useRef(null);

  const login = useCallback((data) => {
    const normalized = {
      email: data.email,
      role: data.role,
      name: data.name || data.username || data.email,
      avatar: data.avatar ?? null
    };

    setAuth(normalized);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAuth(null);
    }
  }, []);

  useEffect(() => {
    let refreshPromise = null;

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;
        const status = error?.response?.status;
        const url = originalRequest?.url || '';

        if (!originalRequest || (status !== 401 && status !== 403) || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (url.includes('/auth/refresh')) {
          // Refresh failed, logout the user
          logout();
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = axios.post('/auth/refresh').finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;

          try {
            await axios.get('/auth/me');
          } catch {
            // ignore
          }

          return axios(originalRequest);
        } catch (refreshErr) {
          // Refresh failed, logout the user
          logout();
          return Promise.reject(refreshErr);
        }
      }
    );

    axiosInterceptorRef.current = interceptor;

    return () => {
      if (axiosInterceptorRef.current !== null) {
        axios.interceptors.response.eject(axiosInterceptorRef.current);
      }
    };
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.get('/auth/me');
        if (res.data) {
          login(res.data);
        }
      } catch (err) {
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [login]);

  useEffect(() => {
    return;
  }, []);


  useEffect(() => {
    const role = auth?.role;
    if (!auth || !role) return;

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
          setAuth((prev) => {
            if (!prev) return prev;
            return { ...prev, avatar: profilePictureUrl };
          });
        }
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.role]);

  const updateAvatar = (avatar) => {
    setAuth(prev => {
      if (!prev) return prev;
      return { ...prev, avatar: avatar || null };
    });
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ auth, user: auth, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
