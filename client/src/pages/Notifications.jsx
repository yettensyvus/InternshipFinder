import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  clearAllNotifications,
  fetchNotifications,
  fetchUnreadCount,
  markAllRead,
  markRead,
  subscribeToNotifications
} from '../services/notifications';
import { showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';
import CustomDateTimePicker from '../components/CustomDateTimePicker';

function Dropdown({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const active = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        aria-label={ariaLabel}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{active.label}</span>
        <span className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${
                value === o.value
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{o.label}</span>
              {o.right ? <span className="text-xs text-gray-500 dark:text-gray-400">{o.right}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Notifications() {
  const { auth } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    read: '',
    actorEmail: '',
    jobId: '',
    applicationId: '',
    from: '',
    to: '',
    fromDateTime: '',
    toDateTime: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.read === 'true') params.read = true;
        if (filters.read === 'false') params.read = false;
        if (filters.actorEmail) params.actorEmail = filters.actorEmail;
        if (filters.jobId) params.jobId = Number(filters.jobId);
        if (filters.applicationId) params.applicationId = Number(filters.applicationId);
        if (filters.from) params.from = new Date(filters.from).toISOString();
        if (filters.to) params.to = new Date(filters.to).toISOString();
        if (filters.fromDateTime) params.from = new Date(filters.fromDateTime).toISOString();
        if (filters.toDateTime) params.to = new Date(filters.toDateTime).toISOString();

        const list = await fetchNotifications(params);
        setItems(list);
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        showToast('notifications-load', 'error', t('notificationsPage.failedToLoad'));
        console.error('Notifications load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
    const unsub = subscribeToNotifications(() => load());
    return unsub;
  }, []);

  useEffect(() => {
    const reload = async () => {
      try {
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.read === 'true') params.read = true;
        if (filters.read === 'false') params.read = false;
        if (filters.actorEmail) params.actorEmail = filters.actorEmail;
        if (filters.jobId) params.jobId = Number(filters.jobId);
        if (filters.applicationId) params.applicationId = Number(filters.applicationId);
        if (filters.from) params.from = new Date(filters.from).toISOString();
        if (filters.to) params.to = new Date(filters.to).toISOString();
        if (filters.fromDateTime) params.from = new Date(filters.fromDateTime).toISOString();
        if (filters.toDateTime) params.to = new Date(filters.toDateTime).toISOString();

        const list = await fetchNotifications(params);
        setItems(list);
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        showToast('notifications-load', 'error', t('notificationsPage.failedToLoad'));
        console.error('Notifications load error:', err);
      }
    };

    if (auth?.token) {
      reload();
    }
  }, [filters, auth?.token]);

  const visibleItems = useMemo(() => items, [items]);

  const typeOptions = useMemo(
    () => [
      { value: '', label: t('notificationsPage.all'), right: t('notificationsPage.type') },
      { value: 'APPLICATION_SUBMITTED', label: t('notificationsPage.types.APPLICATION_SUBMITTED'), right: 'APPLICATION_SUBMITTED' },
      { value: 'APPLICATION_STATUS_CHANGED', label: t('notificationsPage.types.APPLICATION_STATUS_CHANGED'), right: 'APPLICATION_STATUS_CHANGED' },
      { value: 'USER_REGISTERED', label: t('notificationsPage.types.USER_REGISTERED'), right: 'USER_REGISTERED' },
      { value: 'JOB_POSTED', label: t('notificationsPage.types.JOB_POSTED'), right: 'JOB_POSTED' },
      { value: 'RESUME_UPLOADED', label: t('notificationsPage.types.RESUME_UPLOADED'), right: 'RESUME_UPLOADED' }
    ],
    [t]
  );

  const readOptions = useMemo(
    () => [
      { value: '', label: t('notificationsPage.all'), right: t('notificationsPage.read') },
      { value: 'false', label: t('notificationsPage.unread'), right: 'UNREAD' },
      { value: 'true', label: t('notificationsPage.readLabel'), right: 'READ' }
    ],
    [t]
  );

  const handleMarkAllRead = () => {
    markAllRead()
      .then(() => showToast('notifications-mark-all-read', 'success', t('notificationsPage.markedAllRead')))
      .catch(() => showToast('notifications-mark-all-read', 'error', t('notificationsPage.failedMarkAllRead')));
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearAllNotifications();
      setItems([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
      showToast('notifications-clear', 'success', t('notificationsPage.cleared'));
    } catch {
      showToast('notifications-clear', 'error', t('notificationsPage.failedClear'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{t('notificationsPage.title')}</h1>
                <p className="text-white/80 text-sm mt-1">
                  {unreadCount > 0 ? t('notificationsPage.unreadCount', { count: unreadCount }) : t('notificationsPage.allCaughtUp')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                >
                  {t('notificationsPage.markAllRead')}
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                >
                  {t('notificationsPage.clear')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {auth?.role === 'ADMIN' ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('notificationsPage.filters')}</div>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.type')}</label>
                      <Dropdown
                        value={filters.type}
                        options={typeOptions}
                        onChange={(v) => setFilters({ ...filters, type: v })}
                        ariaLabel={t('notificationsPage.type')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.read')}</label>
                      <Dropdown
                        value={filters.read}
                        options={readOptions}
                        onChange={(v) => setFilters({ ...filters, read: v })}
                        ariaLabel={t('notificationsPage.read')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.actorEmail')}</label>
                      <input
                        value={filters.actorEmail}
                        onChange={(e) => setFilters({ ...filters, actorEmail: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('notificationsPage.actorEmailPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.jobId')}</label>
                      <input
                        value={filters.jobId}
                        onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('notificationsPage.jobIdPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.applicationId')}</label>
                      <input
                        value={filters.applicationId}
                        onChange={(e) => setFilters({ ...filters, applicationId: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('notificationsPage.applicationIdPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.fromDateTime')}</label>
                      <CustomDateTimePicker
                        value={filters.fromDateTime || ''}
                        onChange={(v) => setFilters({ ...filters, fromDateTime: v })}
                        placeholder={t('notificationsPage.fromDateTime')}
                        inputClassName="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notificationsPage.toDateTime')}</label>
                      <CustomDateTimePicker
                        value={filters.toDateTime || ''}
                        onChange={(v) => setFilters({ ...filters, toDateTime: v })}
                        placeholder={t('notificationsPage.toDateTime')}
                        inputClassName="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('notificationsPage.loading')}</div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('notificationsPage.noNotifications')}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t('notificationsPage.noNotificationsHint')}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleItems.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id).catch(() => showToast(`notifications-mark-read-${n.id}`, 'error', t('notificationsPage.failedMarkRead')))}
                    className={`w-full text-left rounded-2xl border p-5 transition shadow-sm ${
                      n.read
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                        : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-gray-900 dark:text-white">{n.title}</div>
                        {n.message ? (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.message}</div>
                        ) : null}
                        {n.type ? (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {t('notificationsPage.typePrefix')}{' '}
                            {t(`notificationsPage.types.${n.type}`, { defaultValue: n.type })}
                          </div>
                        ) : null}
                        {n.jobId || n.applicationId ? (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {n.jobId ? <span className="mr-3">Job ID: {n.jobId}</span> : null}
                            {n.applicationId ? <span>Application ID: {n.applicationId}</span> : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                    {!n.read ? (
                      <div className="mt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{t('notificationsPage.unreadBadge')}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!clearing) setShowClearConfirm(false);
            }}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
              <div className="text-lg font-semibold text-white">{t('notificationsPage.clearModalTitle')}</div>
              <div className="mt-1 text-sm text-white/80">{t('notificationsPage.clearModalDescription')}</div>
            </div>

            <div className="p-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t('notificationsPage.clearModalConfirmQuestion')}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold disabled:opacity-60"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmClearAll}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {clearing ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
