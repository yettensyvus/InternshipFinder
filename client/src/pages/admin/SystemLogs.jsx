import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { useTranslation } from 'react-i18next';
import { 
  CommandLineIcon, 
  ArrowPathIcon, 
  FunnelIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function SystemLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError(t('adminDashboard.failedLoadLogs', { defaultValue: 'Failed to load system logs' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target)) {
        setIsLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredLogs = logs
    .filter((log) => (filter === 'ALL' ? true : log.level === filter))
    .filter((log) => {
      if (!normalizedQuery) return true;
      const action = String(log.action || '').toLowerCase();
      const details = String(log.details || '').toLowerCase();
      const userEmail = String(log.userEmail || '').toLowerCase();
      const ipAddress = String(log.ipAddress || '').toLowerCase();
      return (
        action.includes(normalizedQuery) ||
        details.includes(normalizedQuery) ||
        userEmail.includes(normalizedQuery) ||
        ipAddress.includes(normalizedQuery)
      );
    });

  const getLevelBadge = (level) => {
    switch (level) {
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <InformationCircleIcon className="h-3 w-3" />
            INFO
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <ExclamationTriangleIcon className="h-3 w-3" />
            WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircleIcon className="h-3 w-3" />
            ERROR
          </span>
        );
      default:
        return level;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-400 dark:via-rose-400 dark:to-pink-400 pb-2">
              {t('adminDashboard.systemLogs', { defaultValue: 'System Logs' })}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('adminDashboard.logsSubtitle', { defaultValue: 'Monitor system activities and audit trails.' })}
            </p>
          </div>

          <div className="w-full md:w-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div className="w-full md:w-[420px]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('recruiterStudents.search')}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`${t('common.action', { defaultValue: 'Action' })} / ${t('common.user', { defaultValue: 'User' })} / IP / ${t('common.details', { defaultValue: 'Details' })}`}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

              <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('common.level', { defaultValue: 'Level' })}</div>
              <div className="relative" ref={levelDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLevelDropdownOpen((v) => !v)}
                  className="w-[220px] flex items-center justify-between bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                >
                  <span className="font-semibold inline-flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-gray-400" />
                    {filter === 'ALL' ? t('adminDashboard.allLevels', { defaultValue: 'All Levels' }) : filter}
                  </span>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLevelDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                    {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setFilter(lvl);
                          setIsLevelDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-200 ${filter === lvl ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <span className="font-bold">{lvl === 'ALL' ? t('adminDashboard.allLevels', { defaultValue: 'All Levels' }) : lvl}</span>
                        {filter === lvl && <CheckCircleIcon className="h-4 w-4 text-red-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

              <button
                onClick={fetchLogs}
                disabled={loading}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                aria-label={t('common.refresh')}
                title={t('common.refresh')}
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-200/60 dark:border-gray-700/60">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.timestamp', { defaultValue: 'Timestamp' })}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.level', { defaultValue: 'Level' })}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.action', { defaultValue: 'Action' })}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.user', { defaultValue: 'User' })}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.details', { defaultValue: 'Details' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ArrowPathIcon className="h-8 w-8 text-rose-500 animate-spin" />
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('common.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <CommandLineIcon className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('adminDashboard.noLogs', { defaultValue: 'No logs found' })}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.userEmail || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:break-words transition-all">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
