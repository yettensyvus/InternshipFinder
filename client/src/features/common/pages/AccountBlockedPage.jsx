import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AuthPageLayout from '../../auth/ui/templates/AuthPageLayout';

export default function AccountBlocked() {
  const { t } = useTranslation();

  return (
    <AuthPageLayout cardClassName="max-w-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('accountBlocked.title')}</h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          {t('accountBlocked.message')}
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 text-left">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('accountBlocked.contactAdmin')}</div>
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            - {t('accountBlocked.emailLabel')}: {t('accountBlocked.adminEmail')}
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            - {t('accountBlocked.phoneLabel')}: {t('accountBlocked.adminPhone')}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold"
          >
            {t('accountBlocked.backToLogin')}
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
}
