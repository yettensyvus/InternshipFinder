import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../services/axios';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markRead, subscribeToNotifications } from '../services/notifications';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  const navigate = useNavigate();

  const axiosInterceptorRef = useRef(null);

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

        if (url.includes('/auth/') && !url.includes('/auth/me')) {
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

  const canShowRecommendToast = useMemo(() => auth?.role === 'STUDENT', [auth?.role]);
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      hasShownToastRef.current = false;
    }
  }, [auth]);

  useEffect(() => {
    if (!canShowRecommendToast) return;
    if (hasShownToastRef.current) return;

    let intervalId;
    let cancelled = false;
    let lastSeenRecommendedId = null;

    const toastId = 'job-recommended-toast';

    const showRecommended = (notif) => {
      if (!notif || !notif.id || !notif.jobId) return;
      if (toast.isActive(toastId)) return;

      const title = t(`notificationsPage.types.${notif.type}`, {
        defaultValue: notif.title || 'Job recommended'
      });
      const message =
        notif.type === 'JOB_RECOMMENDED'
          ? t('notificationsPage.recommendedMessage', { job: notif.message || '' })
          : notif.message;
      const clickHint = t('notificationsPage.clickToOpen', { defaultValue: 'Click to open' });

      toast.info(
        (
          <button
            type="button"
            className="text-left"
            onClick={async () => {
              try {
                await markRead(notif.id);
              } catch {
                // ignore
              }
              navigate(`/jobs/${notif.jobId}`);
              toast.dismiss(toastId);
            }}
          >
            <div className="font-semibold">{title}</div>
            {message ? <div className="text-sm opacity-90">{message}</div> : null}
            <div className="text-xs mt-1 opacity-70">{clickHint}</div>
          </button>
        ),
        {
          toastId,
          autoClose: 8000,
          closeOnClick: false
        }
      );
    };

    const refresh = async () => {
      if (cancelled) return;
      try {
        const list = await fetchNotifications({ type: 'JOB_RECOMMENDED', read: false });
        if (!Array.isArray(list) || list.length === 0) return;

        const latest = list[0];
        if (!latest?.id || latest.id === lastSeenRecommendedId) return;
        lastSeenRecommendedId = latest.id;
        hasShownToastRef.current = true;
        showRecommended(latest);
      } catch {
        // ignore
      }
    };

    refresh();
    const unsub = subscribeToNotifications(() => refresh());
    intervalId = window.setInterval(refresh, 12000);

    const handleReset = () => {
      hasShownToastRef.current = false;
      refresh();
    };
    window.addEventListener('notifications:reset-toast', handleReset);

    return () => {
      cancelled = true;
      unsub?.();
      window.removeEventListener('notifications:reset-toast', handleReset);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [canShowRecommendToast, navigate]);


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

  const updateAvatar = useCallback((avatarUrl) => {
    setAuth((prev) => {
      if (!prev) return prev;
      return { ...prev, avatar: avatarUrl || null };
    });
  });

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
