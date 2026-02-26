import { useEffect, useRef, useState } from 'react';

export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  buttonClassName = '',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const list = Array.isArray(options) ? options : [];
  const active = list.find((o) => o.value === value) || list[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          'w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        }
        aria-label={ariaLabel}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {active.label}
        </span>
        <span
          className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          className={
            menuClassName ||
            'absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50'
          }
        >
          {list.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange?.(o.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${
                value === o.value
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{o.label}</span>
              {o.right ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {o.right}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
