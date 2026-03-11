export const getInitials = (value, { fallback = '?' } = {}) => {
  const v = String(value || '').trim();
  if (!v) return fallback;
  const parts = v.split(' ').filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return (a + b).toUpperCase() || fallback;
};
