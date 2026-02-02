import { useState, useEffect, useRef } from 'react';
import axios from '../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showLoadingToast, showToast } from '../services/toast';
import { useAuth } from '../hooks/useAuth';
import { useOtpCooldown } from '../hooks/useOtpCooldown';

export default function Settings() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState('idle'); // idle | otp_sent

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordStep, setPasswordStep] = useState('idle'); // idle | otp_sent

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const {
    isCoolingDown: isEmailCoolingDown,
    remainingSeconds: emailRemainingSeconds,
    startCooldown: startEmailCooldown,
    clearCooldown: clearEmailCooldown
  } = useOtpCooldown(newEmail ? `otp:settings-email:${newEmail}` : '');

  const {
    isCoolingDown: isPasswordCoolingDown,
    remainingSeconds: passwordRemainingSeconds,
    startCooldown: startPasswordCooldown,
    clearCooldown: clearPasswordCooldown
  } = useOtpCooldown(auth?.email ? `otp:settings-password:${auth.email}` : '');

  const prevNewEmailRef = useRef(newEmail);
  useEffect(() => {
    if (prevNewEmailRef.current !== newEmail) {
      clearEmailCooldown();
      prevNewEmailRef.current = newEmail;
    }
  }, [newEmail, clearEmailCooldown]);

  const prevPasswordInputsRef = useRef({ currentPassword: '', newPassword: '' });
  useEffect(() => {
    if (
      prevPasswordInputsRef.current.currentPassword !== currentPassword ||
      prevPasswordInputsRef.current.newPassword !== newPassword
    ) {
      clearPasswordCooldown();
      prevPasswordInputsRef.current = { currentPassword, newPassword };
    }
  }, [currentPassword, newPassword, clearPasswordCooldown]);

  useEffect(() => {
    if (!auth?.token) {
      navigate('/login');
    }
  }, [auth?.token, navigate]);

  const spinner = (
    <span className="inline-flex items-center justify-center">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      {t('common.pleaseWait')}
    </span>
  );

  const requestEmailOtp = async () => {
    const toastId = 'settings-email-request';
    if (!newEmail.trim()) {
      showToast(toastId, 'error', t('settings.pleaseEnterNewEmail'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) {
      showToast(toastId, 'error', t('auth.invalidEmail'));
      return;
    }

    if (isEmailCoolingDown) {
      return;
    }

    setLoadingEmail(true);
    showLoadingToast(toastId, t('settings.sendingOtpToNewEmail'));
    try {
      await axios.post('/settings/request-email-change', { newEmail });
      showToast(toastId, 'success', t('settings.otpSentNewEmail'), { autoClose: 2000 });
      setEmailStep('otp_sent');
      setEmailOtp('');
      startEmailCooldown();
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('settings.failedToSendOtp'), { autoClose: 2500 });
    } finally {
      setLoadingEmail(false);
    }
  };

  const confirmEmailChange = async () => {
    const toastId = 'settings-email-confirm';
    if (!emailOtp.trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }

    setLoadingEmail(true);
    showLoadingToast(toastId, t('settings.confirmingEmailChange'));
    try {
      await axios.post('/settings/confirm-email-change', { otp: emailOtp });
      showToast(toastId, 'success', t('settings.emailChangedRelogin'), { autoClose: 2000 });

      logout();
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('settings.failedToConfirmEmailChange'), { autoClose: 2500 });
    } finally {
      setLoadingEmail(false);
    }
  };

  const requestPasswordOtp = async () => {
    const toastId = 'settings-password-request';
    if (!currentPassword.trim()) {
      showToast(toastId, 'error', t('settings.pleaseEnterCurrentPassword'));
      return;
    }

    if (isPasswordCoolingDown) {
      return;
    }

    setLoadingPassword(true);
    showLoadingToast(toastId, t('settings.sendingOtpToYourEmail'));
    try {
      await axios.post('/settings/request-password-change', { currentPassword, newPassword: '' });
      showToast(toastId, 'success', t('settings.otpSentToYourEmail'), { autoClose: 2000 });
      setPasswordStep('otp_sent');
      setPasswordOtp('');
      startPasswordCooldown();
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('settings.failedToSendOtp'), { autoClose: 2500 });
    } finally {
      setLoadingPassword(false);
    }
  };

  const confirmPasswordChange = async () => {
    const toastId = 'settings-password-confirm';
    if (!passwordOtp.trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }
    if (!newPassword.trim()) {
      showToast(toastId, 'error', t('settings.pleaseEnterNewPassword'));
      return;
    }

    setLoadingPassword(true);
    showLoadingToast(toastId, t('settings.changingPassword'));
    try {
      await axios.post('/settings/confirm-password-change', {
        otp: passwordOtp,
        currentPassword,
        newPassword
      });
      showToast(toastId, 'success', t('settings.passwordChangedSuccessfully'), { autoClose: 2000 });

      setCurrentPassword('');
      setNewPassword('');
      setPasswordOtp('');
      setPasswordStep('idle');
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('settings.failedToChangePassword'), { autoClose: 2500 });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.changeEmail')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.changeEmailHint')}</p>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.currentEmail')}</label>
                <input
                  value={auth?.email || ''}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.newEmail')}</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={loadingEmail}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('settings.newEmailPlaceholder')}
                />
              </div>

              {emailStep === 'otp_sent' && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.otp')}</label>
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    disabled={loadingEmail}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('auth.otpPlaceholder')}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={requestEmailOtp}
                  disabled={loadingEmail || isEmailCoolingDown}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold"
                >
                  {loadingEmail
                    ? spinner
                    : `${emailStep === 'otp_sent' ? t('auth.resendOtp') : t('auth.sendOtp')}${isEmailCoolingDown ? ` (${emailRemainingSeconds}s)` : ''}`}
                </button>

                {emailStep === 'otp_sent' && (
                  <button
                    type="button"
                    onClick={confirmEmailChange}
                    disabled={loadingEmail}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                  >
                    {t('settings.confirmEmailChange')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.changePassword')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.changePasswordHint')}</p>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loadingPassword}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>

              {passwordStep === 'otp_sent' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.newPassword')}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loadingPassword}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('settings.otp')}</label>
                    <input
                      type="text"
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value)}
                      disabled={loadingPassword}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('auth.otpPlaceholder')}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={requestPasswordOtp}
                  disabled={loadingPassword || isPasswordCoolingDown}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold"
                >
                  {loadingPassword
                    ? spinner
                    : `${passwordStep === 'otp_sent' ? t('auth.resendOtp') : t('auth.sendOtp')}${isPasswordCoolingDown ? ` (${passwordRemainingSeconds}s)` : ''}`}
                </button>

                {passwordStep === 'otp_sent' && (
                  <button
                    type="button"
                    onClick={confirmPasswordChange}
                    disabled={loadingPassword}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                  >
                    {t('settings.confirmPasswordChange')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
