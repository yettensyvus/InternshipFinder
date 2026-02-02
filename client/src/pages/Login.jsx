import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/axios';
import { useAuth } from '../hooks/useAuth';
import { showLoadingToast, showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const toastId = 'login';

    if (!form.email.trim() || !form.password.trim()) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, t('auth.signingIn'));
    try {
      const res = await axios.post('/auth/login', form);
      login(res.data.token, res.data.role, res.data.name || res.data.email, res.data.email, res.data.avatar || null);

      showToast(toastId, 'success', t('auth.loginSuccessful'), { autoClose: 1800 });

      const roleRoutes = {
        STUDENT: '/student/dashboard',
        RECRUITER: '/recruiter/dashboard',
        ADMIN: '/admin/dashboard',
      };

      setTimeout(() => {
        navigate(roleRoutes[res.data.role] || '/dashboard');
      }, 1000);
    } catch (err) {
      const msg = err.response?.data;
      if (msg === 'USER_NOT_FOUND' || msg === 'INVALID_PASSWORD') {
        showToast(toastId, 'error', t('auth.invalidCredentials'));
        return;
      }
      if (msg === 'EMAIL_NOT_VERIFIED') {
        showToast(toastId, 'error', t('auth.pleaseVerifyEmail'));
        navigate('/verify-email-otp', { state: { email: form.email } });
        return;
      }
      showToast(toastId, 'error', msg || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{t('common.appName')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('auth.emailPlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('auth.passwordPlaceholder')}
              required
              disabled={loading}
            />
            <p className="text-right text-sm mt-1">
              <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                {t('auth.forgotPasswordQuestion')}
              </Link>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
            disabled={loading}
          >
            {loading ? t('auth.signingIn') : t('common.signIn')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {t('auth.registerNow')}
          </Link>
        </p>
      </div>
    </div>
  );
}
