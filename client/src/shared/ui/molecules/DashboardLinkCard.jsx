import { Link } from 'react-router-dom';

const borderColorMap = {
  indigo: 'border-indigo-100 dark:border-indigo-800',
  blue: 'border-blue-100 dark:border-blue-800',
  emerald: 'border-emerald-100 dark:border-emerald-800',
  purple: 'border-purple-100 dark:border-purple-800',
  red: 'border-red-100 dark:border-red-800',
  rose: 'border-rose-100 dark:border-rose-800',
};

const textColorMap = {
  indigo: 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
  blue: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  purple: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-400',
  red: 'text-red-600 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400',
  rose: 'text-rose-600 dark:text-rose-300 group-hover:text-rose-600 dark:group-hover:text-rose-300',
};

export default function DashboardLinkCard({
  to,
  icon,
  title,
  description,
  color = 'indigo',
  className = '',
}) {
  const border = borderColorMap[color] || borderColorMap.indigo;
  const text = textColorMap[color] || textColorMap.indigo;

  return (
    <Link
      to={to}
      className={`group bg-white/60 dark:bg-gray-800/60 border ${border} backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300 ${className}`}
    >
      <div className={`${text} text-4xl mb-4`}>{icon}</div>
      <h3
        className={`text-xl font-semibold text-gray-800 dark:text-white mb-2 ${text} transition-colors`}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}
