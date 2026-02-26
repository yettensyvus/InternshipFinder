import Spinner from './Spinner';

const base =
  'inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg',
  secondary:
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800',
  danger:
    'border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-900/20 text-red-700 dark:text-red-200 hover:bg-red-100/80 dark:hover:bg-red-900/30',
  ghost:
    'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-gray-800/80 shadow-sm',
  icon: 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800',
  'header-action':
    'px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-3 text-base rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const v = variants[variant] || variants.primary;
  const s = variant === 'icon' ? '' : (sizes[size] || sizes.md);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${v} ${s} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center">
          <Spinner size="sm" className="mr-2" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
