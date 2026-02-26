import { Badge, Button } from '@ui/atoms';

export default function JobCard({
  job,
  onApply,
  applying = false,
  onClick,
  t,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm text-left hover:shadow-md transition w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {job.title}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {job.company || t('common.notAvailable')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {job.location || t('common.notAvailable')}
          </div>
        </div>
        <Badge color="blue">{t('studentJobs.open')}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Badge color={job.paid ? 'indigo' : 'gray'}>
          {job.paid ? t('studentJobs.paid') : t('studentJobs.unpaid')}
        </Badge>
        {job.duration ? (
          <Badge color="purple">{job.duration}</Badge>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {job.deadline
            ? `${t('studentJobs.deadline')}: ${job.deadline}`
            : `${t('studentJobs.deadline')}: ${t('common.notAvailable')}`}
        </div>
        {onApply ? (
          <Button
            variant="primary"
            size="sm"
            loading={applying}
            onClick={(e) => {
              e.stopPropagation();
              onApply(job.id);
            }}
          >
            {applying ? t('studentJobs.applying') : t('studentJobs.apply')}
          </Button>
        ) : null}
      </div>
    </button>
  );
}
