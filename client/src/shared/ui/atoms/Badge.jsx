const colorMap = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  const c = colorMap[color] || colorMap.gray;
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c} ${className}`}>
      {children}
    </span>
  );
}
