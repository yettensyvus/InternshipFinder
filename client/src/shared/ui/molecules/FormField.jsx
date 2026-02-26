import { forwardRef } from 'react';
import { Input } from '@ui/atoms';

const FormField = forwardRef(function FormField(
  { label, error, id, className = '', children, ...inputProps },
  ref
) {
  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      ) : null}
      {children || <Input ref={ref} id={id} {...inputProps} />}
      {error ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
});

export default FormField;
