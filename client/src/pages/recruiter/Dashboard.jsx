import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RecruiterDashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-20">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 mb-4">
          💼 {t('dashboards.recruiterTitle')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('dashboards.recruiterSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Link
          to="/recruiter/post-job"
          className="group bg-white/60 dark:bg-gray-800/60 border border-purple-100 dark:border-purple-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-purple-600 dark:text-purple-400 text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {t('dashboards.postJob')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.postJobHint')}
          </p>
        </Link>

        <Link
          to="/recruiter/my-jobs"
          className="group bg-white/60 dark:bg-gray-800/60 border border-indigo-100 dark:border-indigo-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-indigo-600 dark:text-indigo-400 text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t('dashboards.myPostedJobs')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.myPostedJobsHint')}
          </p>
        </Link>

        <Link
          to="/recruiter/applications"
          className="group bg-white/60 dark:bg-gray-800/60 border border-indigo-100 dark:border-indigo-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-indigo-600 dark:text-indigo-400 text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t('dashboards.viewApplications')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.viewApplicationsHint')}
          </p>
        </Link>
      </div>
    </div>
  );
}
