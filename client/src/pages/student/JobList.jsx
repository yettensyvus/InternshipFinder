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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
            <h1 className="text-2xl font-bold text-white">{t('studentJobs.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('studentJobs.subtitle')}</p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('studentJobs.filters')}</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('studentJobs.search')}</label>
                  <input
                    value={filters.query}
                    onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                    placeholder={t('studentJobs.searchPlaceholder')}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="relative" ref={paidDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('studentJobs.paidLabel')}</label>
                  <button
                    type="button"
                    onClick={() => setIsPaidDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activePaid.label}</span>
                    <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isPaidDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPaidDropdownOpen ? (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
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
                  ) : null}
                </div>

                <div className="relative" ref={typeDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('studentJobs.type')}</label>
                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activeType.label}</span>
                    <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTypeDropdownOpen ? (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
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
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 opacity-0">{t('studentJobs.clearFilters')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ query: '', type: '', paid: '' });
                      setIsTypeDropdownOpen(false);
                      setIsPaidDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t('studentJobs.clearFilters')}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('studentJobs.loading')}</div>
            ) : visibleJobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {jobs.length === 0 ? t('studentJobs.none') : t('studentJobs.noResults')}
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {jobs.length === 0 ? t('studentJobs.noneHint') : t('studentJobs.noResultsHint')}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleJobs.map(job => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{job.company || t('common.notAvailable')}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{job.location || t('common.notAvailable')}</div>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                        {t('studentJobs.open')}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className={`text-xs font-semibold px-3 py-1 rounded-full ${job.paid ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                        {job.paid ? t('studentJobs.paid') : t('studentJobs.unpaid')}
                      </div>
                      {job.duration ? (
                        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                          {job.duration}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {job.deadline ? `${t('studentJobs.deadline')}: ${job.deadline}` : `${t('studentJobs.deadline')}: ${t('common.notAvailable')}`}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          apply(job.id);
                        }}
                        disabled={applyingJobId === job.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {applyingJobId === job.id ? t('studentJobs.applying') : t('studentJobs.apply')}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
