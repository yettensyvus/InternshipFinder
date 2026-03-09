import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/axios';
import { useAuth } from '../hooks/useAuth';
import { showLoadingToast, showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';
import { getDashboardPathForRole } from '../utils/rolePaths';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = yup.object({
    email: yup.string().trim().required(),
    password: yup.string().trim().required()
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const onSubmit = async (data) => {
    const toastId = 'login';

    setLoading(true);
    showLoadingToast(toastId, t('auth.signingIn'));
    try {
      const res = await axios.post('/auth/login', data);
      login(res.data);

      showToast(toastId, 'success', t('auth.loginSuccessful'), { autoClose: 1800 });

      setTimeout(() => {
        navigate(getDashboardPathForRole(res.data.role));
      }, 1000);
    } catch (err) {
      const msg = err.response?.data;
      if (msg === 'USER_NOT_FOUND' || msg === 'INVALID_PASSWORD') {
        showToast(toastId, 'error', t('auth.invalidCredentials'));
        return;
      }
      if (msg === 'EMAIL_NOT_VERIFIED') {
        showToast(toastId, 'error', t('auth.pleaseVerifyEmail'));
        navigate('/verify-email-otp', { state: { email: data.email } });
        return;
      }
      if (msg === 'ACCOUNT_BLOCKED') {
        toast.dismiss(toastId);
        navigate('/account-blocked');
        return;
      }
      showToast(toastId, 'error', msg || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'login';
    const { email, password } = getValues();
    if (!String(email || '').trim() || !String(password || '').trim()) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }
    showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">{t('common.appName')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              placeholder={t('auth.emailPlaceholder')}
              required
              disabled={loading}
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.pleaseFillAllFields')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              placeholder={t('auth.passwordPlaceholder')}
              required
              disabled={loading}
            />
            {errors.password ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.pleaseFillAllFields')}</p>
            ) : null}
            <p className="text-right text-sm mt-1">
              <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                {t('auth.forgotPasswordQuestion')}
              </Link>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
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
