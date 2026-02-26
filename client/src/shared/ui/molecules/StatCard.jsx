export default function StatCard({
  label,
  value,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          {value != null ? (
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </div>
          ) : null}
          {subtitle ? (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </div>
          ) : null}
        </div>
        {children ? <div className="text-right">{children}</div> : null}
      </div>
    </div>
  );
}
