import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../components/Dropdown';
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

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError(t('adminDashboard.failedLoadLogs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-400 dark:via-rose-400 dark:to-pink-400 pb-1">
              {t('adminDashboard.systemLogs')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-xl text-base font-medium mx-auto md:mx-0">
              {t('adminDashboard.logsSubtitle')}
            </p>
          </div>

          <div className="w-full md:w-[320px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.searchLogsPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">
              {t('adminDashboard.systemLogs')}
            </div>
            <button onClick={fetchLogs} className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Dropdown open={isLevelDropdownOpen} onOpenChange={setIsLevelDropdownOpen}>
              {({ open, toggle, close, ref }) => (
                <div className="relative flex-1 sm:flex-none" ref={ref}>
                  <button
                    type="button"
                    onClick={toggle}
                    className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                  >
                    <FunnelIcon className="h-4 w-4 text-gray-400" />
                    <span>{filter === 'ALL' ? t('common.allLevels') : filter}</span>
                    <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {['ALL', 'INFO', 'WARN', 'ERROR'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            setFilter(level);
                            close();
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-200 ${filter === level ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className="font-bold">{level === 'ALL' ? t('common.allLevels') : level}</span>
                          {filter === level && <CheckCircleIcon className="h-4 w-4 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Dropdown>
            <button onClick={fetchLogs} className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-200/60 dark:border-gray-700/60">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.timestamp')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.level')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.action')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t('common.user')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">{t('common.ip')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.details')}</th>
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
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('adminDashboard.noLogs')}</span>
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
                        <div className="sm:hidden text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[120px]">
                          {log.userEmail || t('common.systemUser')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {log.userEmail || t('common.systemUser')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono hidden md:table-cell">
                        {log.ipAddress || t('common.notAvailable')}
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
