import { useEffect, useRef, useState } from 'react';
import axios from '../services/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { showLoadingToast, showToast } from '../services/toast';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const roles = [
    { code: 'STUDENT', label: `🎓 ${t('auth.student')}` },
    { code: 'RECRUITER', label: `💼 ${t('auth.recruiter')}` }
  ];

  const activeRole = roles.find(r => r.code === form.role) || roles[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const toastId = 'register';

    const username = (form.username || '').trim();
    const email = (form.email || '').trim();
    const password = (form.password || '').trim();

    if (!username) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }
    if (username.length < 2) {
      showToast(toastId, 'error', t('auth.usernameMin'));
      return;
    }
    if (!email) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }
    if (!password) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }
    if (password.length < 6) {
      showToast(toastId, 'error', t('auth.passwordMin'));
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, form.role === 'RECRUITER' ? t('auth.creatingAccountSendingOtp') : t('auth.creatingAccount'));
    try {
      const res = await axios.post('/auth/register', { ...form, name: username, username, email, password });
      if (res.data === 'RECRUITER_OTP_SENT') {
        showToast(toastId, 'success', t('auth.registrationSuccessVerifyEmail'), { autoClose: 1800 });
        setTimeout(() => navigate('/verify-email-otp', { state: { email: form.email } }), 1200);
        return;
      }

      showToast(toastId, 'success', t('auth.registrationSuccessLogin'), { autoClose: 1800 });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.registrationFailed'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {t('auth.createAccountTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {t('auth.joinToday')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.username')}</label>
            <input
              type="text"
              placeholder={t('auth.usernamePlaceholder')}
              value={form.username}
              onChange={handleChange('username')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={form.email}
              onChange={handleChange('email')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange('password')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.role')}</label>
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="text-sm font-medium">{activeRole.label}</span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                  {roles.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, role: r.code }));
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${form.role === r.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{r.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('common.pleaseWait')}
              </span>
            ) : (
              t('auth.register')
            )}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('common.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
