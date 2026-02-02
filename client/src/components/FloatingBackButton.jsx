import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FloatingBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const hidden = useMemo(() => {
    const path = location.pathname;
    const hideExact = ['/', '/login', '/register', '/forgot-password', '/verify-otp', '/reset-password', '/account-blocked'];
    if (hideExact.includes(path)) return true;
    if (path === '/not-found') return true;
    return false;
  }, [location.pathname]);

  if (hidden) return null;

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-2xl px-4 py-3 shadow-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur hover:bg-white dark:hover:bg-gray-900 text-gray-900 dark:text-white transition"
      aria-label={t('common.goBack')}
      title={t('common.goBack')}
    >
      <ArrowLeft size={18} />
      <span className="text-sm font-semibold">{t('common.goBack')}</span>
    </button>
  );
}
