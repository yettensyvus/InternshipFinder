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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
            <h1 className="text-2xl font-bold text-white">{t('studentApplications.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('studentApplications.subtitle')}</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('studentApplications.loading')}</div>
            ) : applications.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('studentApplications.none')}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('studentApplications.noneHint')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map(app => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      const jobId = app?.job?.id;
                      if (jobId) {
                        navigate(`/jobs/${jobId}`);
                      }
                    }}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{app.job?.title || t('common.notAvailable')}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{app.job?.company || t('common.notAvailable')}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{app.job?.location || t('common.notAvailable')}</div>
                      </div>
                      <div className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {app.status || t('common.notAvailable')}
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{t('studentApplications.jobId')}:</span>{' '}
                      {app.job?.id || t('common.notAvailable')}
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
