import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function StudentDashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-20">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 mb-4">
          🎓 {t('dashboards.studentTitle')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('dashboards.studentSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <Link
          to="/student/profile"
          className="group bg-white/60 dark:bg-gray-800/60 border border-indigo-100 dark:border-indigo-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-indigo-600 dark:text-indigo-400 text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t('dashboards.manageProfile')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.manageProfileHint')}
          </p>
        </Link>

        <Link
          to="/student/resume"
          className="group bg-white/60 dark:bg-gray-800/60 border border-blue-100 dark:border-blue-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-blue-600 dark:text-blue-400 text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {t('dashboards.uploadResume')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.uploadResumeHint')}
          </p>
        </Link>

         <Link
          to="/student/cv-builder"
          className="group bg-white/60 dark:bg-gray-800/60 border border-emerald-100 dark:border-emerald-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-emerald-600 dark:text-emerald-400 text-4xl mb-4">📑</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {t('dashboards.cvBuilder')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.cvBuilderHint')}
          </p>
        </Link>

        <Link
          to="/student/jobs"
          className="group bg-white/60 dark:bg-gray-800/60 border border-purple-100 dark:border-purple-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-purple-600 dark:text-purple-400 text-4xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {t('dashboards.viewJobs')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.viewJobsHint')}
          </p>
        </Link>

        <Link
          to="/student/applications"
          className="group bg-white/60 dark:bg-gray-800/60 border border-red-100 dark:border-red-800 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300"
        >
          <div className="text-red-600 dark:text-red-400 text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {t('dashboards.trackApplications')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('dashboards.trackApplicationsHint')}
          </p>
        </Link>
      </div>
    </div>
  );
}
