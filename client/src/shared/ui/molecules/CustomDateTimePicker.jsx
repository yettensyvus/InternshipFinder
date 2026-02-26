import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enUS, ro, ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en', enUS);
registerLocale('ro', ro);
registerLocale('ru', ru);

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toLocalDateTimeValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function parseLocalDateTimeValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const TextInput = forwardRef(function TextInput(
  { value, onClick, onChange, placeholder, disabled, className },
  ref
) {
  return (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      readOnly
    />
  );
});

export default function CustomDateTimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  inputClassName,
  minDate,
  maxDate,
  timeIntervals = 15
}) {
  const { i18n } = useTranslation();
  const selected = useMemo(() => parseLocalDateTimeValue(value), [value]);
  const language = i18n?.language || 'en';
  const locale = language === 'ro' || language === 'ru' ? language : 'en';
  const timeCaption = locale === 'ro' ? 'Ora' : locale === 'ru' ? 'Время' : 'Time';

  return (
    <DatePicker
      selected={selected}
      onChange={(date) => onChange(toLocalDateTimeValue(date))}
      showTimeSelect
      timeIntervals={timeIntervals}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText={placeholder}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      locale={locale}
      timeCaption={timeCaption}
      popperClassName="if-datepicker-popper"
      calendarClassName="if-datepicker"
      wrapperClassName="w-full"
      customInput={
        <TextInput
          className={
            inputClassName ||
            'w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white'
          }
        />
      }
    />
  );
}
