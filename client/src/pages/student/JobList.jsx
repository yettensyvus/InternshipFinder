import { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function JobList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    query: '',
    type: '',
    paid: ''
  });

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [isPaidDropdownOpen, setIsPaidDropdownOpen] = useState(false);
  const paidDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (paidDropdownRef.current && !paidDropdownRef.current.contains(event.target)) {
        setIsPaidDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const paidParam = filters.paid === '' ? undefined : filters.paid === 'paid';
        const [jobsRes, appsRes] = await Promise.all([
          axios.get('/jobs', { params: paidParam === undefined ? {} : { paid: paidParam } }),
          axios.get('/student/applications')
        ]);

        const allJobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
        const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
        const applied = new Set(
          apps
            .filter(a => a?.status !== 'REJECTED' && a?.status !== 'HIRED')
            .map(a => a?.job?.id)
            .filter(Boolean)
        );

        setAppliedJobIds(applied);
        setJobs(allJobs.filter(j => (j?.isActive ?? j?.active) && !applied.has(j?.id)));
      } catch (err) {
        showToast('student-jobs-load', 'error', t('studentJobs.failedLoad'));
        console.error('Jobs fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.paid]);

  const visibleJobs = useMemo(() => {
    const query = (filters.query || '').trim().toLowerCase();
    const type = (filters.type || '').trim().toUpperCase();

    return jobs.filter((job) => {
      if (type && String(job?.type || '').toUpperCase() !== type) {
        return false;
      }
      if (query) {
        const haystack = [job?.title, job?.company, job?.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, filters.query, filters.type]);

  const paidOptions = [
    { value: '', label: t('studentJobs.all') },
    { value: 'paid', label: t('studentJobs.paid') },
    { value: 'unpaid', label: t('studentJobs.unpaid') }
  ];

  const activePaid = paidOptions.find(o => o.value === filters.paid) || paidOptions[0];

  const typeOptions = [
    { value: '', label: t('studentJobs.all') },
    { value: 'JOB', label: t('studentJobs.typeJob') },
    { value: 'INTERNSHIP', label: t('studentJobs.typeInternship') }
  ];
  const activeType = typeOptions.find(o => o.value === filters.type) || typeOptions[0];

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / pageSize));
  const pagedJobs = visibleJobs.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.type, filters.paid]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const apply = async (jobId) => {
    const toastId = `student-apply-${jobId || 'unknown'}`;
    try {
      if (!jobId) {
        showToast(toastId, 'error', t('studentJobs.invalidJob'));
        return;
      }
      if (applyingJobId) {
        return;
      }
      setApplyingJobId(jobId);
      await axios.post(`/student/apply/${jobId}`);
      showToast(toastId, 'success', t('studentJobs.applied'));

      setAppliedJobIds(prev => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
      setJobs(prev => prev.filter(j => j?.id !== jobId));
    } catch (err) {
      showToast(toastId, 'error', t('studentJobs.alreadyApplied'));
      console.error('Apply error:', err);
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 pb-2">
              {t('studentJobs.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('studentJobs.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('studentJobs.filters')}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('studentJobs.search')}</label>
                <input
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  placeholder={t('studentJobs.searchPlaceholder')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="relative" ref={paidDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('studentJobs.paidLabel')}</label>
                <button
                  type="button"
                  onClick={() => setIsPaidDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                >
                  <span className="text-sm font-semibold">{activePaid.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isPaidDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPaidDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                    {paidOptions.map((opt) => (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, paid: opt.value }));
                          setIsPaidDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${filters.paid === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={typeDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('studentJobs.type')}</label>
                <button
                  type="button"
                  onClick={() => setIsTypeDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                >
                  <span className="text-sm font-semibold">{activeType.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, type: opt.value }));
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${filters.type === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('studentJobs.loading')}</div>
            ) : visibleJobs.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400 py-10 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {jobs.length === 0 ? t('studentJobs.none') : t('studentJobs.noResults')}
                </div>
                <p className="mt-1 text-sm">
                  {jobs.length === 0 ? t('studentJobs.noneHint') : t('studentJobs.noResultsHint')}
                </p>
                {(filters.query || filters.type || filters.paid) && (
                  <button
                    onClick={() => setFilters({ query: '', type: '', paid: '' })}
                    className="mt-4 text-sm font-bold text-violet-600 hover:underline"
                  >
                    {t('studentJobs.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pagedJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="group text-left h-full rounded-3xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors line-clamp-1">
                            {job.title || t('common.notAvailable')}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">{job.company || t('common.notAvailable')}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.location || t('common.notAvailable')}</div>
                        </div>

                        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 flex-shrink-0">
                          {t('studentJobs.open')}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${job.paid ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {job.paid ? t('studentJobs.paid') : t('studentJobs.unpaid')}
                        </div>
                        {job.type && (
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                            {job.type}
                          </div>
                        )}
                        {job.duration && (
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {job.duration}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate order-2 sm:order-1">
                          {job.deadline ? `${t('studentJobs.deadline')}: ${job.deadline}` : `${t('studentJobs.deadline')}: ${t('common.notAvailable')}`}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            apply(job.id);
                          }}
                          disabled={applyingJobId === job.id}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0 order-1 sm:order-2"
                        >
                          {applyingJobId === job.id ? t('studentJobs.applying') : t('studentJobs.apply')}
                        </button>
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