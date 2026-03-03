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
    if (axiosInterceptorRef.current != null) return;
    axiosInterceptorRef.current = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          setAuth(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (axiosInterceptorRef.current != null) {
        axios.interceptors.response.eject(axiosInterceptorRef.current);
        axiosInterceptorRef.current = null;
      }
    };
  }, []);


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
