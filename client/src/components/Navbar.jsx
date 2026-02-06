
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { fetchUnreadCount, subscribeToNotifications } from '../services/notifications';
import { useTranslation } from 'react-i18next';
import {
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { auth, logout, updateAvatar } = useAuth();
  const { t, i18n } = useTranslation();
  const getThemeMode = () => localStorage.getItem('themeMode') || 'light';
  const [themeMode, setThemeMode] = useState(getThemeMode);
  const [darkMode, setDarkMode] = useState(() => {
    const mode = getThemeMode();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const apply = () => {
      const mode = getThemeMode();
      setThemeMode(mode);
      if (mode === 'dark') setDarkMode(true);
      if (mode === 'light') setDarkMode(false);
      if (mode === 'system') setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => {
      if (getThemeMode() === 'system') {
        setDarkMode(media.matches);
      }
    };

    const onAppSettingsChanged = () => apply();

    apply();
    window.addEventListener('app-settings-changed', onAppSettingsChanged);
    media.addEventListener('change', onSystemThemeChange);
    return () => {
      window.removeEventListener('app-settings-changed', onAppSettingsChanged);
      media.removeEventListener('change', onSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileDropdownOpen(false);
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) setIsLanguageDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let intervalId;

    const getPollMs = () => {
      const raw = localStorage.getItem('notifPollMs');
      const ms = raw ? Number(raw) : 10000;
      return Number.isFinite(ms) && ms >= 2000 ? ms : 10000;
    };

    const refresh = async () => {
      if (!auth?.token) {
        setUnreadCount(0);
        return;
      }
      try {
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    };

    const onFocus = () => {
      refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    refresh();

    const unsub = subscribeToNotifications(() => {
      refresh();
    });

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    if (auth?.token) {
      intervalId = window.setInterval(refresh, getPollMs());
    }

    return () => {
      unsub?.();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [auth?.token]);

  const toggleDarkMode = () => {
    const nextMode = darkMode ? 'light' : 'dark';
    localStorage.setItem('themeMode', nextMode);
    setThemeMode(nextMode);
    setDarkMode(nextMode === 'dark');
  };
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  const getDashboardLink = () => {
    switch (auth?.role) {
      case 'STUDENT': return '/student/dashboard';
      case 'RECRUITER': return '/recruiter/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  const getProfileLink = () => {
    switch (auth?.role) {
      case 'STUDENT': return '/student/profile';
      case 'RECRUITER': return '/recruiter/profile';
      case 'ADMIN': return '/admin/profile';
      default: return '/profile';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'STUDENT':
        return t('common.roles.student');
      case 'RECRUITER':
        return t('common.roles.recruiter');
      case 'ADMIN':
        return t('common.roles.admin');
      default:
        return t('common.notAvailable');
    }
  };

  const displayName = auth?.name || auth?.username || t('common.user');

  const handleAvatarError = () => {
    updateAvatar?.(null);
  };

  const changeLanguage = (lng) => {
    localStorage.setItem('lng', lng);
    i18n.changeLanguage(lng);
    setIsLanguageDropdownOpen(false);
  };

  const languages = [
    { code: 'en', label: t('common.languages.en'), short: 'EN' },
    { code: 'ro', label: t('common.languages.ro'), short: 'RO' },
    { code: 'ru', label: t('common.languages.ru'), short: 'RU' }
  ];

  const activeLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-all duration-300">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          <div className="flex items-center justify-center">
            <img src="/favicon.png" alt="Internship Finder" className="h-8 w-auto object-contain" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 group-hover:from-violet-700 group-hover:via-indigo-700 group-hover:to-blue-700 transition-all duration-200">
            {t('common.appName')}
          </span>
        </div>
      </Link>
      <div className="hidden md:flex gap-4 items-center">
        <div className="relative" ref={languageDropdownRef}>
          <button
            type="button"
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            aria-label={t('common.language')}
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activeLanguage.short}</span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLanguageDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
              {languages.map((lng) => (
                <button
                  key={lng.code}
                  type="button"
                  onClick={() => changeLanguage(lng.code)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${i18n.language === lng.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <span className="font-medium">{lng.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{lng.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {auth ? (
          <>
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label={t('common.notifications')}
            >
              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              ) : null}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="relative">
                  {auth.avatar ? (
                    <img
                      src={auth.avatar}
                      alt={t('common.user')}
                      className="w-8 h-8 rounded-full object-cover border-2 border-violet-200 dark:border-violet-700"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getRoleLabel(auth.role)}
                  </span>
                </div>

                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      {auth.avatar ? (
                        <img
                          src={auth.avatar}
                          alt={t('common.user')}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={handleAvatarError}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {auth.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      {t('common.dashboard')}
                    </Link>
                    <Link
                      to={getProfileLink()}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <UserIcon className="h-5 w-5" />
                      {t('common.profileSettings')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      {t('common.settings')}
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      {t('common.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center text-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-gray-800/80 transition-all duration-200 font-semibold shadow-sm"
            >
              {t('common.signIn')}
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 font-medium"
            >
              {t('common.getStarted')}
            </Link>
          </div>
        )}

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
          aria-label={darkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
        >
          {darkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
          )}
        </button>
      </div>
      <div className="flex md:hidden items-center gap-2" ref={mobileMenuRef}>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          aria-label="Menu"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {isMobileMenuOpen && (
          <div className="absolute right-4 top-[calc(100%+0.5rem)] w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-2 py-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
                <span className="text-sm font-medium">{darkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}</span>
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

            <div className="px-2 py-2">
              <div className="px-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('common.language')}</div>
              <div className="grid grid-cols-3 gap-2 px-2">
                {languages.map((lng) => (
                  <button
                    key={lng.code}
                    type="button"
                    onClick={() => changeLanguage(lng.code)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors duration-200 ${i18n.language === lng.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {lng.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

            {auth ? (
              <div className="px-2 py-2">
                <Link
                  to="/notifications"
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <BellIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{t('common.notifications')}</span>
                  </span>
                  {unreadCount > 0 ? (
                    <span className="min-w-6 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full text-center">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('common.dashboard')}</span>
                </Link>

                <Link
                  to={getProfileLink()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('common.profileSettings')}</span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('common.settings')}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-red-600 dark:text-red-400"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('common.signOut')}</span>
                </button>
              </div>
            ) : (
              <div className="px-2 py-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  to="/register"
                  className="block mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('common.getStarted')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

