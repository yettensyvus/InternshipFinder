import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-10 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-400 dark:via-rose-400 dark:to-pink-400 pb-1">
              {t('adminDashboard.title')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-xl text-base font-medium">
              {t('adminDashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('adminDashboard.system.lastRefresh')}</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : '—'}</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 group"
            >
              <ArrowPathIcon className={`h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: t('adminDashboard.totalUsers'), value: totalUsers, series: usersSeries, color: 'from-indigo-500 to-blue-500', icon: UsersIcon },
            { label: t('adminDashboard.jobsPosted'), value: totalJobs, series: jobsSeries, color: 'from-emerald-500 to-teal-500', icon: BriefcaseIcon },
            { label: t('adminDashboard.applications'), value: totalApplications, series: applicationsSeries, color: 'from-rose-500 to-pink-500', icon: ClipboardDocumentCheckIcon }
          ].map((stat, i) => (
            <div key={i} className="group bg-white dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-full`}></div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 relative h-12 flex items-end">
                <Sparkline values={stat.series} strokeClass={`stroke-gray-900 dark:stroke-white opacity-20`} />
                <div className="absolute inset-0 flex items-end pointer-events-none opacity-40">
                   <Sparkline values={stat.series} strokeClass={`stroke-2`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Action Center */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                onClick={() => navigate('/admin/users')}
                className="group relative bg-gray-900 dark:bg-gray-800 rounded-[1.5rem] p-6 text-left overflow-hidden shadow-xl hover:scale-[1.01] transition-all duration-300 h-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500 to-rose-600 opacity-20 rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-5 border border-white/10 group-hover:border-white/20 transition-colors">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1.5">{t('adminDashboard.manageUsers')}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{t('adminDashboard.subtitle')}</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/logs')}
                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[1.5rem] p-6 text-left overflow-hidden shadow-md hover:scale-[1.01] transition-all duration-300 h-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-500 to-slate-600 opacity-[0.05] rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                    <CommandLineIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">{t('adminDashboard.systemLogs', { defaultValue: 'System Logs' })}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{t('adminDashboard.logsSubtitle', { defaultValue: 'Monitor system activities and audit trails.' })}</p>
                </div>
              </button>
            </div>

            {/* Combined Activity Chart */}
            <div className="flex-1 bg-white dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 rounded-[2rem] p-6 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('adminDashboard.activityTitle')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('adminDashboard.activitySubtitle')}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="flex-1 min-h-[160px] w-full flex items-end">
                <Sparkline values={combinedSeries} strokeClass="stroke-red-600 dark:stroke-rose-400" />
              </div>
            </div>
          </div>

          {/* System Sidebar */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 rounded-[2rem] p-6 shadow-inner flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <CpuChipIcon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('adminDashboard.systemTitle')}</h3>
              </div>
              
              <div className="space-y-4 flex-1">
                {[
                  { label: t('adminDashboard.system.cpuCores'), value: systemInfo.cores ?? '—' },
                  { label: t('adminDashboard.system.deviceMemory'), value: systemInfo.deviceMemoryGb != null ? `${systemInfo.deviceMemoryGb} GB` : '—' },
                  { label: t('adminDashboard.system.jsHeap'), value: systemInfo.jsHeapUsedMb != null ? `${systemInfo.jsHeapUsedMb}/${systemInfo.jsHeapTotalMb} MB` : '—', sub: heapPct != null ? `${heapPct}%` : null },
                  { label: t('adminDashboard.system.statsLatency'), value: statsLatencyMs != null ? `${statsLatencyMs} ms` : '—' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-200/40 dark:border-gray-700/40 last:border-0">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{item.value}</span>
                      {item.sub && <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">{item.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">API</div>
                <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 break-all">{apiBaseUrl || 'Internal'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
