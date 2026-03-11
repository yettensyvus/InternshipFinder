import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export function yearToDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d{4}$/.test(raw)) return null;
  const y = Number(raw);
  if (!Number.isFinite(y)) return null;
  return new Date(y, 0, 1);
}

export function dateToYear(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return String(date.getFullYear());
}

export default function YearPicker({ value, onChange, placeholder, inputClassName }) {
  return (
    <DatePicker
      selected={yearToDate(value)}
      onChange={(date) => onChange(dateToYear(date))}
      showYearPicker
      dateFormat="yyyy"
      placeholderText={placeholder}
      openToDate={yearToDate(value) ?? new Date()}
      popperClassName="if-datepicker-popper"
      calendarClassName="if-datepicker"
      wrapperClassName="w-full"
      customInput={<input className={inputClassName} readOnly />}
    />
  );
}
