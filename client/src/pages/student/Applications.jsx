import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../services/toast';

export default function Applications() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/student/applications');
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast('student-applications', 'error', t('studentApplications.failedLoad'));
        console.error('Student applications fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const statusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING') {
      return {
        label: t('common.status.pending', { defaultValue: 'Pending' }),
        pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'
      };
    }
    if (s === 'SHORTLISTED') {
      return {
        label: t('recruiterApplications.shortlist'),
        pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30'
      };
    }
    if (s === 'SCHEDULED') {
      return {
        label: t('recruiterInterviews.title'),
        pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800/30'
      };
    }
    if (s === 'HIRED') {
      return {
        label: t('recruiterHired.statusHired'),
        pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
      };
    }
    if (s === 'REJECTED') {
      return {
        label: t('recruiterApplications.reject'),
        pill: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800/30'
      };
    }
    return {
      label: s,
      pill: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-100 dark:border-gray-700'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-400 dark:via-rose-400 dark:to-pink-400 pb-2">
              {t('studentApplications.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('studentApplications.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('studentApplications.title')}
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('studentApplications.loading')}</div>
            ) : applications.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400 py-10 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{t('studentApplications.none')}</div>
                <p className="mt-1 text-sm">{t('studentApplications.noneHint')}</p>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {applications.map(app => {
                    const meta = statusMeta(app.status);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          const jobId = app?.job?.id;
                          if (jobId) navigate(`/jobs/${jobId}`);
                        }}
                        className="group text-left h-full rounded-3xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-4 w-full">
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                              {app.job?.title || t('common.notAvailable')}
                            </div>
                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">{app.job?.company || t('common.notAvailable')}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{app.job?.location || t('common.notAvailable')}</div>
                          </div>

                          <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex-shrink-0 ${meta.pill}`}>
                            {meta.label}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <div className={`text-xs font-semibold px-3 py-1 rounded-full ${app.job?.paid ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {app.job?.paid ? t('studentJobs.paid') : t('studentJobs.unpaid')}
                          </div>
                          {app.job?.type && (
                            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                              {app.job?.type}
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-5 flex items-center justify-between gap-4 w-full text-xs text-gray-500 dark:text-gray-400">
                          <div className="truncate">
                            {t('studentApplications.jobId')}: #{app.job?.id || 'N/A'}
                          </div>
                          <div className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white text-[10px] font-bold shadow-md hover:shadow-lg transition-all flex-shrink-0">
                            {t('recruiterApplications.shortlist')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
