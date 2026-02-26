export default function DashboardPageLayout({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10 ${className}`}
    >
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
