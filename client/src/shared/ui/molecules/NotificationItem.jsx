export default function NotificationItem({ notification, onClick, t }) {
  const n = notification;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition shadow-sm ${
        n.read
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
          : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {n.title}
          </div>
          {n.message ? (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {n.message}
            </div>
          ) : null}
          {n.type ? (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('notificationsPage.typePrefix')}{' '}
              {t(`notificationsPage.types.${n.type}`, { defaultValue: n.type })}
            </div>
          ) : null}
          {n.jobId || n.applicationId ? (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {n.jobId ? (
                <span className="mr-3">Job ID: {n.jobId}</span>
              ) : null}
              {n.applicationId ? (
                <span>Application ID: {n.applicationId}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
        </div>
      </div>
      {!n.read ? (
        <div className="mt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {t('notificationsPage.unreadBadge')}
        </div>
      ) : null}
    </button>
  );
}
