const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-12 h-12 border-4',
};

export default function Spinner({ size = 'sm', color = 'white', className = '' }) {
  const s = sizeMap[size] || sizeMap.sm;
  const borderColor = color === 'white'
    ? 'border-white border-t-transparent'
    : 'border-indigo-600 border-t-transparent';

  return (
    <span
      className={`inline-block ${s} ${borderColor} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
