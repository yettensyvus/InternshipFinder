import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import { showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const apply = async () => {
    if (!id) return;

    if (!auth) {
      navigate('/login');
      return;
    }

    if (auth.role !== 'STUDENT') {
      showToast('job-details-apply', 'error', t('common.accessDenied'));
      return;
    }

    if (applying) return;

    try {
      setApplying(true);
      await axios.post(`/student/apply/${id}`);
      showToast('job-details-apply', 'success', t('studentJobs.applied'));
      navigate('/student/applications');
    } catch (err) {
      showToast('job-details-apply', 'error', t('studentJobs.alreadyApplied'));
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        showToast('job-details-load', 'error', t('jobDetails.failedLoad'));
        console.error('Job details fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!auth || auth.role !== 'STUDENT') {
      setHasApplied(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/student/applications');
        const apps = Array.isArray(res.data) ? res.data : [];
        const applied = apps.some((a) => String(a?.job?.id) === String(id));
        if (!cancelled) setHasApplied(applied);
      } catch {
        if (!cancelled) setHasApplied(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.role, id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-28 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-blue-200 mb-2 pb-1">
                {t('jobDetails.title')}
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-3xl">{t('jobDetails.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.pleaseWait')}</div>
          ) : !job ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('jobDetails.notFound')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <div className="flex flex-col min-h-[auto] sm:min-h-[520px]">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                          {job.recruiterProfilePictureUrl ? (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg flex-shrink-0">
                              <img
                                src={job.recruiterProfilePictureUrl}
                                alt={job.recruiterCompanyName || job.company || t('jobDetails.company')}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">
                              {job.title || t('common.notAvailable')}
                            </div>
                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {(job.recruiterCompanyName || job.company) || t('common.notAvailable')}
                              {job.location ? ` • ${job.location}` : ''}
                            </div>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {t('jobDetails.postedBy')}{' '}
                              <span className="font-medium text-gray-900 dark:text-white">{job.recruiterCompanyName || t('common.notAvailable')}</span>
                              {job.recruiterEmail ? <span className="block sm:inline"> ({job.recruiterEmail})</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <div
                            className={`text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full ${(job.active ?? job.isActive)
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                          >
                            {(job.active ?? job.isActive) ? t('jobDetails.open') : t('jobDetails.closed')}
                          </div>
                          {job.type ? (
                            <div className="text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                              {job.type}
                            </div>
                          ) : null}
                          <div
                            className={`text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full ${job.paid
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}
                          >
                            {job.paid ? t('jobDetails.paid') : t('jobDetails.unpaid')}
                          </div>
                        </div>
                      </div>

                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('jobDetails.description')}</div>
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {job.description || t('common.notAvailable')}
                      </div>
                    </div>

                      <div className="mt-auto pt-6 border-t border-gray-200/70 dark:border-gray-700/70">
                        <div className="hidden sm:flex flex-col items-center justify-center gap-3">
                          {!auth ? (
                            <Link
                              to="/login"
                              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                              {t('jobDetails.signInToApply')}
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </Link>
                          ) : auth.role === 'STUDENT' && !hasApplied ? (
                            <button
                              type="button"
                              onClick={apply}
                              disabled={applying || !(job.active ?? job.isActive)}
                              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                              {applying ? t('studentJobs.applying') : t('studentJobs.apply')}
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </button>
                          ) : null}

                          {auth && auth.role === 'STUDENT' && hasApplied ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                              {t('studentJobs.alreadyApplied')}{' '}
                              <Link to="/student/applications" className="text-violet-700 dark:text-violet-300 hover:underline font-semibold">
                                {t('jobDetails.viewApplications')}
                              </Link>
                            </div>
                          ) : null}

                          {auth && auth.role !== 'STUDENT' ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{t('common.accessDenied')}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('jobDetails.title')}</div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.posted')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {job.createdAt ? new Date(job.createdAt).toLocaleString() : t('common.notAvailable')}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.deadline')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{job.deadline || t('common.notAvailable')}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.company')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{job.recruiterCompanyName || job.company || t('common.notAvailable')}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.duration')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{job.duration || t('common.notAvailable')}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.compensation')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{job.compensation || t('common.notAvailable')}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('jobDetails.payment')}</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{job.paid ? t('jobDetails.paid') : t('jobDetails.unpaid')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="border-t border-gray-200/70 dark:border-gray-700/70 bg-white/85 dark:bg-gray-900/85 backdrop-blur">
          <div className="px-4 py-3">
            {!auth ? (
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-lg"
              >
                {t('jobDetails.signInToApply')}
              </Link>
            ) : auth.role === 'STUDENT' && !hasApplied ? (
              <button
                type="button"
                onClick={apply}
                disabled={applying || !(job?.active ?? job?.isActive)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-lg disabled:opacity-60"
              >
                {applying ? t('studentJobs.applying') : t('studentJobs.apply')}
              </button>
            ) : auth && auth.role === 'STUDENT' && hasApplied ? (
              <Link
                to="/student/applications"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-semibold"
              >
                {t('jobDetails.viewApplications')}
              </Link>
            ) : (
              <div className="w-full text-center text-xs text-gray-600 dark:text-gray-400">
                {t('common.accessDenied')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
