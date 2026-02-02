import { useState, useEffect } from 'react';
import axios from '../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showLoadingToast, showToast } from '../services/toast';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const { t } = useTranslation();

  useEffect(() => {
    if (!email) {
      showToast('verify-otp', 'error', t('auth.noEmailProvided'));
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const toastId = 'verify-otp';
    if (!otp.trim()) {
      showToast(toastId, 'error', t('auth.pleaseEnterOtp'));
      return;
    }

    setLoading(true);
    showLoadingToast(toastId, t('auth.verifyingOtp'));
    try {
      await axios.post('/auth/verify-otp', { email, otp });
      showToast(toastId, 'success', t('auth.otpVerified'), { autoClose: 1500 });
      setTimeout(() => {
        navigate('/reset-password', { state: { email, otp } });
      }, 1000);
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('auth.otpInvalidOrExpired'), { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{t('common.appName')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('auth.verifyOtpSubtitle')}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.otp')}
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('auth.otpPlaceholder')}
              required
              disabled={loading}
            />
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
      </div>
    </div>
  );
}
