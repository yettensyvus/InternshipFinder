function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
};

export default function Avatar({
  src,
  name,
  size = 'sm',
  className = '',
  onError,
}) {
  const s = sizeMap[size] || sizeMap.sm;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${s} rounded-full object-cover border-2 border-violet-200 dark:border-violet-700 ${className}`}
        onError={onError}
      />
    );
  }

  return (
    <div
      className={`${s} rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
