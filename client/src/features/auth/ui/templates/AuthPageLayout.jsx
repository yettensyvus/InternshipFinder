export default function AuthPageLayout({ children, className = '', cardClassName = '' }) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className={`max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl ${cardClassName}`}>
        {children}
      </div>
    </div>
  );
}
