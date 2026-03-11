import { useEffect, useMemo, useState } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../services/toast';
import { MagnifyingGlassIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Dropdown from '../../components/Dropdown';

export default function MyJobs() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, CLOSED
  const [isStatusDropdownOpen, setIsStatusFilterOpen] = useState(false);

  const pageSize = 4;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/recruiter/my-jobs');
        setJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast('recruiter-my-jobs', 'error', t('recruiterMyJobs.failedLoad'));
        console.error('My jobs fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const q = query.toLowerCase().trim();
      const matchesQuery = !q || 
        job.title?.toLowerCase().includes(q) || 
        job.company?.toLowerCase().includes(q) || 
        job.location?.toLowerCase().includes(q);
      
      const isActive = job.active ?? job.isActive;
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'OPEN' && isActive) || 
        (statusFilter === 'CLOSED' && !isActive);

      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const pagedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

  const statusOptions = [
    { value: 'ALL', label: t('studentJobs.all') },
    { value: 'OPEN', label: t('recruiterJobManage.open') },
    { value: 'CLOSED', label: t('recruiterJobManage.closed') }
  ];
  const activeStatusLabel = statusOptions.find(o => o.value === statusFilter)?.label;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 pb-2">
              {t('recruiterMyJobs.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('recruiterMyJobs.subtitle')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="w-full md:w-80 relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('recruiterStudents.search')}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('recruiterStudents.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="w-full md:w-48 relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('recruiterApplications.type')}
              </label>
              <Dropdown open={isStatusDropdownOpen} onOpenChange={setIsStatusFilterOpen}>
                {({ open, toggle, close, ref }) => (
                  <div className="relative" ref={ref}>
                    <button
                      type="button"
                      onClick={toggle}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{activeStatusLabel}</span>
                      </div>
                      <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="absolute top-full left-0 right-0 mt-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                        {statusOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setStatusFilter(opt.value);
                              close();
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${statusFilter === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('recruiterMyJobs.count', { count: filteredJobs.length })}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('common.pleaseWait')}</div>
            ) : jobs.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">
                {t('recruiterMyJobs.none')}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pagedJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                      className="group bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span className="font-medium">{job.company}</span>
                            {job.location && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>{job.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border flex-shrink-0 ${
                          (job.active ?? job.isActive)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        }`}>
                          {(job.active ?? job.isActive) ? t('recruiterJobManage.open') : t('recruiterJobManage.closed')}
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            {t('recruiterMyJobs.deadline')}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold mt-0.5">
                            {job.deadline}
                          </span>
                        </div>
                        <div className="text-violet-600 dark:text-violet-400 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          {t('recruiterJobManage.manage')}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('recruiterStudents.page', { page, total: totalPages })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-60"
                    >
                      {t('recruiterStudents.prev')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-60"
                    >
                      {t('recruiterStudents.next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
