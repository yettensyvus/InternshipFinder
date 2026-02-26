import { useEffect, useState } from 'react';
import axios from '@/services/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showLoadingToast, showToast } from '@/services/toast';
import { useOtpCooldown } from '@/hooks/useOtpCooldown';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import AuthHeader from '../ui/molecules/AuthHeader';
import AuthPageLayout from '../ui/templates/AuthPageLayout';

export default function VerifyEmailOtp() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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

  const { isCoolingDown, remainingSeconds, startCooldown } = useOtpCooldown(
    email ? `otp:verify-email:${email}` : ''
  );

  useEffect(() => {
    if (!email) {
      showToast('verify-email-otp', 'error', t('auth.noEmailProvided'));
      navigate('/register');
    }
  }, [email, navigate, t]);

  const onSubmit = async (data) => {
    const toastId = 'verify-email-otp';

    setLoading(true);
    showLoadingToast(toastId, t('auth.verifyingOtp'));
    try {
      await axios.post('/auth/verify-email-otp', { email, otp: data.otp });
      showToast(toastId, 'success', t('auth.emailVerifiedNowLogin'), { autoClose: 1800 });
      setTimeout(() => {
        navigate('/login', { state: { email } });
      }, 1000);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.otpInvalidOrExpired'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'verify-email-otp';
    const { otp } = getValues();
    if (!String(otp || '').trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }
    showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
  };

  const handleResend = async () => {
    if (!email) return;

    if (isCoolingDown) {
      return;
    }

    setResending(true);
    const toastId = 'verify-email-resend';
    showLoadingToast(toastId, t('auth.resendingOtp'));
    try {
      await axios.post('/auth/resend-email-otp', { email });
      showToast(toastId, 'success', t('auth.otpSentToEmail'), { autoClose: 1800 });
      startCooldown();
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.failedToResendOtp'), { autoClose: 2500 });
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <AuthPageLayout cardClassName="text-center">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('common.loading') || 'Loading...'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('auth.redirecting') || 'Redirecting to registration...'}
        </p>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthHeader title={t('common.appName')} subtitle={t('auth.verifyEmailOtpSubtitle')} hint={email} />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.emailVerificationOtp')}
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
              t('auth.verifyEmail')
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
            disabled={resending || loading || isCoolingDown}
          >
            {resending ? (
              <span className="inline-flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('auth.sendOtpLoading')}
              </span>
            ) : (
              `${t('auth.resendOtp')}${isCoolingDown ? ` (${remainingSeconds}s)` : ''}`
            )}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.backTo')}{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </form>
    </AuthPageLayout>
  );
}
