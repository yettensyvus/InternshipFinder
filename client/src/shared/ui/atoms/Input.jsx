import { forwardRef } from 'react';

const baseClass =
  'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

const Input = forwardRef(function Input({ className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`${baseClass} ${className}`}
      {...rest}
    />
  );
});

export default Input;
