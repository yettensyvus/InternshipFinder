import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import { showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';

export default function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{t('jobDetails.title')}</h1>
                <p className="text-white/80 text-sm mt-1">{t('jobDetails.subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
              >
                {t('common.goBack')}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.pleaseWait')}</div>
            ) : !job ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('jobDetails.notFound')}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div className="flex items-start gap-6">
                    {job.recruiterProfilePictureUrl ? (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg flex-shrink-0">
                        <img
                          src={job.recruiterProfilePictureUrl}
                          alt={job.recruiterCompanyName || job.company || t('jobDetails.company')}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}

                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{job.title || t('common.notAvailable')}</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {(job.recruiterCompanyName || job.company) || t('common.notAvailable')}
                        {job.location ? ` • ${job.location}` : ''}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('jobDetails.postedBy')}{' '}
                        <span className="font-medium text-gray-900 dark:text-white">{job.recruiterCompanyName || t('common.notAvailable')}</span>
                        {job.recruiterEmail ? <span> ({job.recruiterEmail})</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${(job.active ?? job.isActive) ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                      {(job.active ?? job.isActive) ? t('jobDetails.open') : t('jobDetails.closed')}
                    </div>
                    {job.type ? (
                      <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                        {job.type}
                      </div>
                    ) : null}
                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${job.paid ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                      {job.paid ? t('jobDetails.paid') : t('jobDetails.unpaid')}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <div className="mt-6">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('jobDetails.description')}</div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {job.description || t('common.notAvailable')}
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
