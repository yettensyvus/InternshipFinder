import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty) => {
  if (dirty == null) return '';
  return DOMPurify.sanitize(String(dirty));
};
