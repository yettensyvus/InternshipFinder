export default function AuthHeader({ title, subtitle, hint }) {
  return (
    <div className="text-center mb-6">
      {title ? (
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{title}</h1>
      ) : null}
      {subtitle ? (
        <p className="text-gray-600 dark:text-gray-300 mt-1">{subtitle}</p>
      ) : null}
      {hint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{hint}</p>
      ) : null}
    </div>
  );
}
