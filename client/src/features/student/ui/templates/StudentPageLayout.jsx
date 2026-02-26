export default function StudentPageLayout({
  title,
  subtitle,
  header,
  headerClassName = 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600',
  maxWidthClassName = 'max-w-6xl',
  children,
  className = ''
}) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10 ${className}`}>
      <div className={`${maxWidthClassName} mx-auto`}>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className={`px-6 py-8 ${headerClassName}`}>
            {header || (
              <>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {subtitle ? <p className="text-white/80 text-sm mt-1">{subtitle}</p> : null}
              </>
            )}
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
