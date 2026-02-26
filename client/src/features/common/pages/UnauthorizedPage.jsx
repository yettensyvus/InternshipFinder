import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AuthPageLayout from '../../auth/ui/templates/AuthPageLayout';

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <AuthPageLayout>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('unauthorized.title')}</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">{t('unauthorized.description')}</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-md"
          >
            {t('unauthorized.goHome')}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          >
            {t('unauthorized.goBack')}
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}
