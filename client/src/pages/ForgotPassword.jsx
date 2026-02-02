import { useEffect, useRef, useState } from 'react';
import axios from '../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { showLoadingToast, showToast } from '../services/toast';
import { useTranslation } from 'react-i18next';
import { useOtpCooldown } from '../hooks/useOtpCooldown';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isCoolingDown, remainingSeconds, startCooldown, clearCooldown } = useOtpCooldown(
    email ? `otp:forgot-password:${email}` : ''
  );

  const prevEmailRef = useRef(email);
  useEffect(() => {
    if (prevEmailRef.current !== email) {
      clearCooldown();
      prevEmailRef.current = email;
    }
  }, [email, clearCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const toastId = 'forgot-password-send-otp';
    if (!email.trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterYourEmail'));
      return;
    }

    if (isCoolingDown) {
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, t('auth.sendOtpLoading'));
    try {
      await axios.post('/auth/request-otp', { email });
      showToast(toastId, 'success', t('auth.otpSentToEmail'), { autoClose: 1800 });
      setOtpSent(true);
      setOtpVerified(false);
      setOtp('');
      startCooldown();
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('settings.failedToSendOtp'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const toastId = 'forgot-password-verify-otp';
    if (!otp.trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, t('auth.verifyingOtp'));
    try {
      await axios.post('/auth/verify-otp', { email, otp });
      showToast(toastId, 'success', t('auth.otpVerified'), { autoClose: 1500 });
      setOtpVerified(true);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.otpInvalidOrExpired'), { autoClose: 2500 });
      setOtpVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const toastId = 'forgot-password-reset';
    if (!otpVerified) {
      showToast(toastId, 'error', t('auth.pleaseVerifyOtpFirst'));
      return;
    }

    if (!newPassword.trim()) {
      showToast(toastId, 'error', t('settings.pleaseEnterNewPassword'));
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, t('auth.resettingPassword'));
    try {
      await axios.post('/auth/reset-password-otp', { email, otp, newPassword });
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{t('common.appName')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.forgotPasswordTitle')}</p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.registeredEmail')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('auth.emailPlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
            disabled={loading || isCoolingDown}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('auth.sendOtpLoading')}
              </span>
            ) : (
              `${otpSent ? t('auth.resendOtp') : t('auth.sendOtp')}${isCoolingDown ? ` (${remainingSeconds}s)` : ''}`
            )}
          </button>

          {otpSent && (
            <>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.otpConfirmation')}
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('auth.otpPlaceholder')}
                  required
                  disabled={loading || otpVerified}
                />
              </div>

              {!otpVerified && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('auth.verifyOtpLoading')}
                    </span>
                  ) : (
                    t('auth.confirmOtp')
                  )}
                </button>
              )}

              {otpVerified && (
                <>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('auth.newPassword')}
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('auth.newPasswordPlaceholder')}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('auth.resetPasswordLoading')}
                      </span>
                    ) : (
                      t('auth.resetPassword')
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
