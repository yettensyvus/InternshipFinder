import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import axios from '@/services/axios';
import { showLoadingToast, showToast } from '@/services/toast';

import AuthHeader from '../ui/molecules/AuthHeader';
import AuthPageLayout from '../ui/templates/AuthPageLayout';

export default function VerifyOtp() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const { t } = useTranslation();

  const schema = yup.object({
    otp: yup.string().trim().required()
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: { otp: '' },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (!email) {
      showToast('verify-otp', 'error', t('auth.noEmailProvided'));
      navigate('/forgot-password');
    }
  }, [email, navigate, t]);

  const onSubmit = async (data) => {
    const toastId = 'verify-otp';

    setLoading(true);
    showLoadingToast(toastId, t('auth.verifyingOtp'));
    try {
      await axios.post('/auth/verify-otp', { email, otp: data.otp });
      showToast(toastId, 'success', t('auth.otpVerified'), { autoClose: 1500 });
      setTimeout(() => {
        navigate('/reset-password', { state: { email, otp: data.otp } });
      }, 1000);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.otpInvalidOrExpired'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'verify-otp';
    const { otp } = getValues();
    if (!String(otp || '').trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }
    showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
  };

  return (
    <AuthPageLayout>
      <AuthHeader title={t('common.appName')} subtitle={t('auth.verifyOtpSubtitle')} />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.otp')}
          </label>
          <input
            id="otp"
            type="text"
            {...register('otp')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t('auth.otpPlaceholder')}
            required
            disabled={loading}
          />
          {errors.otp ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.pleaseEnterOtp')}</p>
          ) : null}
        </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('auth.verifyOtpLoading')}
              </span>
            ) : (
              t('auth.verifyOtpTitle')
            )}
          </button>
        </form>
    </AuthPageLayout>
  );
}
