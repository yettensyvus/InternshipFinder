import { useEffect, useRef, useState } from 'react';
import axios from '@/services/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { showLoadingToast, showToast } from '@/services/toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import AuthHeader from '../ui/molecules/AuthHeader';
import AuthPageLayout from '../ui/templates/AuthPageLayout';

export default function Register() {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  const navigate = useNavigate();

  const schema = yup.object({
    username: yup.string().trim().required().min(2),
    email: yup.string().trim().required(),
    password: yup.string().trim().required().min(6),
    role: yup.string().required().oneOf(['STUDENT', 'RECRUITER'])
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'STUDENT'
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const roles = [
    { code: 'STUDENT', label: `🎓 ${t('auth.student')}` },
    { code: 'RECRUITER', label: `💼 ${t('auth.recruiter')}` }
  ];

  const role = watch('role');
  const activeRole = roles.find(r => r.code === role) || roles[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = async (data) => {
    const toastId = 'register';

    const username = (data.username || '').trim();
    const email = (data.email || '').trim();
    const password = (data.password || '').trim();

    setLoading(true);
    showLoadingToast(toastId, data.role === 'RECRUITER' ? t('auth.creatingAccountSendingOtp') : t('auth.creatingAccount'));
    try {
      const res = await axios.post('/auth/register', { ...data, name: username, username, email, password });
      if (res.data === 'RECRUITER_OTP_SENT') {
        showToast(toastId, 'success', t('auth.registrationSuccessVerifyEmail'), { autoClose: 1800 });
        setTimeout(() => navigate('/verify-email-otp', { state: { email } }), 1200);
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

  const onInvalid = () => {
    const toastId = 'register';
    const { username, email, password } = getValues();
    if (!String(username || '').trim() || !String(email || '').trim() || !String(password || '').trim()) {
      showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
      return;
    }
    if (String(username || '').trim().length < 2) {
      showToast(toastId, 'error', t('auth.usernameMin'));
      return;
    }
    if (String(password || '').trim().length < 6) {
      showToast(toastId, 'error', t('auth.passwordMin'));
      return;
    }
    showToast(toastId, 'error', t('auth.pleaseFillAllFields'));
  };

  return (
    <AuthPageLayout
      className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      cardClassName="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl"
    >
      <AuthHeader title={t('auth.createAccountTitle')} subtitle={t('auth.joinToday')} />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.username')}</label>
          <input
            type="text"
            placeholder={t('auth.usernamePlaceholder')}
            {...register('username')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {errors.username ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.usernameMin')}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
          <input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            {...register('email')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.pleaseFillAllFields')}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
          <input
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            {...register('password')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.passwordMin')}</p>
          ) : null}
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
                      setValue('role', r.code, { shouldValidate: true, shouldDirty: true });
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${role === r.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{r.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input type="hidden" {...register('role')} />
          {errors.role ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('auth.pleaseFillAllFields')}</p>
          ) : null}
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
    </AuthPageLayout>
  );
}
