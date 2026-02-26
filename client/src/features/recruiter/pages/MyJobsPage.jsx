import { useEffect, useState } from 'react';
import axios from '@/services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/services/toast';

import RecruiterPageLayout from '../ui/templates/RecruiterPageLayout';

export default function MyJobs() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <RecruiterPageLayout
      title={t('recruiterMyJobs.title')}
      subtitle={t('recruiterMyJobs.subtitle')}
      headerClassName="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"
      maxWidthClassName="max-w-5xl"
    >
      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterMyJobs.loading')}</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterMyJobs.none')}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterMyJobs.noneHint')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{job.company || t('common.notAvailable')}</div>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                  {t('recruiterMyJobs.posted')}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-gray-200">{t('recruiterMyJobs.deadline')}:</span>{' '}
                {job.deadline || t('common.notAvailable')}
              </div>
            </button>
          ))}
        </div>
      )}
    </RecruiterPageLayout>
  );
}
