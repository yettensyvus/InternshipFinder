import { useEffect, useState } from 'react';
import axios from '@/services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/services/toast';

import StudentPageLayout from '../ui/templates/StudentPageLayout';

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
    <StudentPageLayout
      title={t('studentApplications.title')}
      subtitle={t('studentApplications.subtitle')}
      headerClassName="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600"
      maxWidthClassName="max-w-5xl"
    >
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
    </StudentPageLayout>
  );
}
