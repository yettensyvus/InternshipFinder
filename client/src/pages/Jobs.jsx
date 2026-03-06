import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import { showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Jobs() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(true);
        const paidParam = filters.paid === '' ? undefined : filters.paid === 'paid';
        const res = await axios.get('/jobs', { params: paidParam === undefined ? {} : { paid: paidParam } });
        const allJobs = Array.isArray(res.data) ? res.data : [];
        setJobs(allJobs.filter(j => (j?.isActive ?? j?.active)));
      } catch (err) {
        showToast('public-jobs-load', 'error', t('studentJobs.failedLoad'));
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-blue-200 mb-2 pb-1">
                {t('studentJobs.title')}
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-3xl">{t('studentJobs.subtitle')}</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('studentJobs.filters')}</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="group text-left h-full rounded-3xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                            {job.title || t('common.notAvailable')}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{job.company || t('common.notAvailable')}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{job.location || t('common.notAvailable')}</div>
                        </div>

                        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          {t('studentJobs.open')}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${job.paid ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                          {job.paid ? t('studentJobs.paid') : t('studentJobs.unpaid')}
                        </div>
                        {job.type ? (
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                            {job.type}
                          </div>
                        ) : null}
                        {job.duration ? (
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {job.duration}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 text-xs text-gray-500 dark:text-gray-400">
                        {job.deadline ? `${t('studentJobs.deadline')}: ${job.deadline}` : `${t('studentJobs.deadline')}: ${t('common.notAvailable')}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
