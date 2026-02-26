import { Badge } from '@ui/atoms';

export default function ApplicationCard({ app, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:shadow-md transition w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {app.job?.title || t('common.notAvailable')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {app.job?.company || t('common.notAvailable')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {app.job?.location || t('common.notAvailable')}
          </div>
        </div>
        <Badge color="gray">{app.status || t('common.notAvailable')}</Badge>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {t('studentApplications.jobId')}:
        </span>{' '}
        {app.job?.id || t('common.notAvailable')}
      </div>
    </button>
  );
}
