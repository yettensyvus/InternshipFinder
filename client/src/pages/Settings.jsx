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
    if (!auth) {
      navigate('/login');
    }
  }, [auth, navigate]);

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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10 text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-blue-200 mb-2 pb-1">
                {t('settings.title')}
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-3xl truncate px-2 sm:px-0">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                {/* Change Email Section */}
                <div className="h-full flex flex-col">
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-700 min-h-[92px]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-6 bg-violet-600 rounded-full"></span>
                      {t('settings.changeEmail')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.changeEmailHint')}</p>
                  </div>

                  <div className="flex-1 grid gap-5 pt-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.currentEmail')}</label>
                      <input
                        value={auth?.email || ''}
                        disabled
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.newEmail')}</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={loadingEmail}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all shadow-sm"
                        placeholder={t('settings.newEmailPlaceholder')}
                      />
                    </div>

                    {emailStep === 'otp_sent' && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.otp')}</label>
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          disabled={loadingEmail}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all shadow-sm"
                          placeholder={t('auth.otpPlaceholder')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-auto">
                    <button
                      type="button"
                      onClick={requestEmailOtp}
                      disabled={loadingEmail || isEmailCoolingDown}
                      className="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
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
                        className="flex-1 px-6 py-2.5 rounded-xl border border-violet-200 dark:border-violet-700/50 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-bold text-sm hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                      >
                        {t('settings.confirmEmailChange')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="h-full flex flex-col">
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-700 min-h-[92px]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                      {t('settings.changePassword')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings.changePasswordHint')}</p>
                  </div>

                  <div className="flex-1 grid gap-5 pt-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.currentPassword')}</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={loadingPassword}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                        placeholder={t('auth.passwordPlaceholder')}
                      />
                    </div>

                    {passwordStep === 'otp_sent' && (
                      <div className="grid gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.newPassword')}</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loadingPassword}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                            placeholder={t('auth.passwordPlaceholder')}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('settings.otp')}</label>
                          <input
                            type="text"
                            value={passwordOtp}
                            onChange={(e) => setPasswordOtp(e.target.value)}
                            disabled={loadingPassword}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                            placeholder={t('auth.otpPlaceholder')}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-auto">
                    <button
                      type="button"
                      onClick={requestPasswordOtp}
                      disabled={loadingPassword || isPasswordCoolingDown}
                      className="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
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
                        className="flex-1 px-6 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
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
      </div>
    </div>
  );
}
