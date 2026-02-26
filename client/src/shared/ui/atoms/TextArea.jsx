import { forwardRef } from 'react';

const baseClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition min-h-[110px]';

const TextArea = forwardRef(function TextArea({ className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseClass} ${className}`}
      {...rest}
    />
  );
});

export default TextArea;
