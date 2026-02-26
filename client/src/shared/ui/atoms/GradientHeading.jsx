const presets = {
  default:
    'from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400',
  purple:
    'from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400',
  red:
    'from-red-600 via-rose-600 to-pink-600',
};

export default function GradientHeading({
  children,
  as: Tag = 'h1',
  preset = 'default',
  className = '',
}) {
  const gradient = presets[preset] || presets.default;
  return (
    <Tag
      className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} ${className}`}
    >
      {children}
    </Tag>
  );
}
