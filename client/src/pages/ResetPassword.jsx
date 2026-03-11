import { useState, useEffect } from 'react';
import axios from '../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showLoadingToast, showToast } from '../services/toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authResetPasswordSchema } from '../schemas/authResetPasswordSchema';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: { newPassword: '' },
    resolver: yupResolver(authResetPasswordSchema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (!email || !otp) {
      showToast('reset-password', 'error', t('auth.noEmailProvided'));
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const onSubmit = async (data) => {
    const toastId = 'reset-password';

    setLoading(true);
    showLoadingToast(toastId, t('auth.resettingPassword'));
    try {
      await axios.post('/auth/reset-password-otp', { email, otp, newPassword: data.newPassword });
      showToast(toastId, 'success', t('auth.resetPasswordSuccess'), { autoClose: 1500 });
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.passwordResetFailed'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'reset-password';
    const { newPassword } = getValues();
    if (!String(newPassword || '').trim()) {
      showToast(toastId, 'error', t('settings.pleaseEnterNewPassword'));
      return;
    }
    showToast(toastId, 'error', t('settings.pleaseEnterNewPassword'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{t('common.appName')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.resetPasswordSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.newPassword')}
            </label>
            <input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('auth.newPasswordPlaceholder')}
              required
              disabled={loading}
            />
            {errors.newPassword ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('settings.pleaseEnterNewPassword')}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
            disabled={loading}
          >
            {loading ? t('auth.resetPasswordLoading') : t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
