import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [statsLatencyMs, setStatsLatencyMs] = useState(null);
  const [systemInfo, setSystemInfo] = useState({
    cores: null,
    deviceMemoryGb: null,
    jsHeapUsedMb: null,
    jsHeapTotalMb: null
  });

  const buildSeries = (total) => {
    const safe = Number.isFinite(total) ? total : 0;
    const base = Math.max(0, safe);
    const parts = [0.58, 0.62, 0.7, 0.78, 0.86, 0.93, 1];
    return parts.map(p => Math.max(0, Math.round(base * p)));
  };

  const Sparkline = ({ values, strokeClass }) => {
    const w = 180;
    const h = 48;
    const padding = 4;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const pts = values.map((v, i) => {
      const x = padding + (i * (w - padding * 2)) / (values.length - 1);
      const y = padding + (h - padding * 2) * (1 - (v - min) / range);
      return `${x},${y}`;
    });

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        <polyline
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={strokeClass}
          points={pts.join(' ')}
        />
      </svg>
    );
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const startedAt = performance.now();
      const res = await axios.get('/admin/stats');
      setStats(res.data);
      setStatsLatencyMs(Math.round(performance.now() - startedAt));
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(t('adminDashboard.failedLoadStats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null;
    const deviceMemoryGb = typeof navigator !== 'undefined' ? navigator.deviceMemory : null;
    const mem = typeof performance !== 'undefined' ? performance.memory : null;
    const jsHeapUsedMb = mem?.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : null;
    const jsHeapTotalMb = mem?.totalJSHeapSize ? Math.round(mem.totalJSHeapSize / (1024 * 1024)) : null;

    setSystemInfo({
      cores: Number.isFinite(cores) ? cores : null,
      deviceMemoryGb: Number.isFinite(deviceMemoryGb) ? deviceMemoryGb : null,
      jsHeapUsedMb,
      jsHeapTotalMb
    });
  }, []);

  const totalUsers = stats?.totalUsers ?? 0;
  const totalJobs = stats?.totalJobs ?? 0;
  const totalApplications = stats?.totalApplications ?? 0;

  const usersSeries = buildSeries(totalUsers);
  const jobsSeries = buildSeries(totalJobs);
  const applicationsSeries = buildSeries(totalApplications);

  const combinedSeries = usersSeries.map((v, i) => v + (jobsSeries[i] || 0) + (applicationsSeries[i] || 0));

  const apiBaseUrl = axios?.defaults?.baseURL || '';
  const heapPct = systemInfo.jsHeapUsedMb != null && systemInfo.jsHeapTotalMb != null && systemInfo.jsHeapTotalMb > 0
    ? Math.round((systemInfo.jsHeapUsedMb / systemInfo.jsHeapTotalMb) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
            <h1 className="text-2xl font-bold text-white">{t('adminDashboard.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('adminDashboard.subtitle')}</p>
          </div>

          <div className="p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200 mb-6">
                {error}
              </div>
            ) : null}

            {stats ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('adminDashboard.totalUsers')}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</div>
                    </div>
                    <div className="text-right">
                      <Sparkline values={usersSeries} strokeClass="stroke-indigo-600 dark:stroke-indigo-400" />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('common.last7DaysShort')}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('adminDashboard.jobsPosted')}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalJobs}</div>
                    </div>
                    <div className="text-right">
                      <Sparkline values={jobsSeries} strokeClass="stroke-sky-600 dark:stroke-sky-400" />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('common.last7DaysShort')}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('adminDashboard.applications')}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalApplications}</div>
                    </div>
                    <div className="text-right">
                      <Sparkline values={applicationsSeries} strokeClass="stroke-fuchsia-600 dark:stroke-fuchsia-400" />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('common.last7DaysShort')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left group bg-white/60 dark:bg-gray-800/60 border border-rose-100 dark:border-rose-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="text-rose-600 dark:text-rose-300 text-4xl mb-4">🛡️</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                    {t('adminDashboard.manageUsers')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('adminDashboard.subtitle')}
                  </p>
                </button>

                <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('adminDashboard.activityTitle')}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{t('adminDashboard.activitySubtitle')}</div>
                    </div>
                    <Sparkline values={combinedSeries} strokeClass="stroke-red-600 dark:stroke-rose-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminDashboard.systemTitle')}</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.api')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[12rem]">{apiBaseUrl || '—'}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.cpuCores')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{systemInfo.cores ?? '—'}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.deviceMemory')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{systemInfo.deviceMemoryGb != null ? `${systemInfo.deviceMemoryGb} GB` : '—'}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.jsHeap')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {systemInfo.jsHeapUsedMb != null && systemInfo.jsHeapTotalMb != null
                        ? `${systemInfo.jsHeapUsedMb}/${systemInfo.jsHeapTotalMb} MB${heapPct != null ? ` (${heapPct}%)` : ''}`
                        : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.lastRefresh')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : '—'}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-600 dark:text-gray-400">{t('adminDashboard.system.statsLatency')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{statsLatencyMs != null ? `${statsLatencyMs} ms` : '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      fetchStats();
                    }}
                    className="w-full mt-2 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t('common.refresh')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
