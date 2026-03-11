import { useEffect, useState, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getInitials } from '../../utils/getInitials';
import { uploadPhoto } from '../../services/uploads';
import { BuildingOfficeIcon, GlobeAltIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef(null);

  const schema = yup.object({
    companyName: yup.string().trim().required().min(2),
    companyWebsite: yup.string().trim()
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { companyName: '', companyWebsite: '' },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/recruiter/profile');
        setForm(res.data);
        reset({
          companyName: res.data?.companyName || '',
          companyWebsite: res.data?.companyWebsite || ''
        });
      } catch (err) {
        showToast('recruiter-profile-load', 'error', t('recruiterProfile.failedLoad'));
        console.error('Recruiter profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSubmit = async (data) => {
    const toastId = 'recruiter-profile-update';
    const companyName = (data.companyName || '').trim();
    const companyWebsite = (data.companyWebsite || '').trim();
    if (companyWebsite && companyWebsite.length < 4) {
      showToast(toastId, 'error', t('recruiterProfile.companyWebsiteMin'));
      return;
    }

    setSaving(true);
    try {
      await axios.put('/recruiter/profile', {
        ...form,
        companyName,
        companyWebsite
      });
      showToast(toastId, 'info', t('recruiterProfile.updated'));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterProfile.updateFailed'));
      console.error('Recruiter profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'recruiter-profile-update';
    if (errors?.companyName) {
      showToast(toastId, 'error', t('recruiterProfile.companyNameMin'));
      return;
    }
    showToast(toastId, 'error', t('recruiterProfile.companyNameRequired'));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPicUploading(true);
    const toastId = 'recruiter-profile-picture';
    try {
      const url = await uploadPhoto({ endpoint: '/recruiter/profile-picture', file });
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast(toastId, 'success', t('recruiterProfile.updated'));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterProfile.updateFailed'));
      console.error('Recruiter profile picture upload error:', err);
    } finally {
      setPicUploading(false);
    }
  };

  const initials = getInitials(form.companyName || t('common.roles.recruiter'), { fallback: '?' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-200 mb-2 pb-1">
                    {t('recruiterProfile.title')}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base max-w-3xl">{form.email || t('common.notAvailable')}</p>
                </div>

                <div className="flex justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (picUploading) return;
                      picInputRef.current?.click();
                    }}
                    disabled={picUploading}
                    className="group relative w-24 h-24 rounded-2xl bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center disabled:opacity-60"
                    title={t('common.uploadPhoto')}
                  >
                    {form.profilePictureUrl ? (
                      <img src={form.profilePictureUrl} alt={t('common.user')} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">{initials}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                        {picUploading ? t('common.pleaseWait') : t('common.uploadPhoto')}
                      </span>
                    </div>
                  </button>
                  <input
                    ref={picInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.company')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.companyName || t('common.notAvailable')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.brandIdentity')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.website')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.companyWebsite || t('common.notAvailable')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.whereLearnMore')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.account')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{t('recruiterProfile.active')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.recruiterAccessEnabled')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterProfile.companySection')}</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'companyName', label: t('recruiterProfile.companyName'), icon: BuildingOfficeIcon },
                      { key: 'companyWebsite', label: t('recruiterProfile.companyWebsite'), icon: GlobeAltIcon },
                      { key: 'email', label: t('recruiterProfile.email'), icon: UserCircleIcon, disabled: true }
                    ].map(({ key, label, icon: Icon, disabled }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Icon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            className={`w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2 text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-purple-500/20 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                            value={disabled ? (form[key] || '') : undefined}
                            {...(!disabled ? register(key) : {})}
                            disabled={disabled}
                            readOnly={disabled}
                          />
                        </div>
                        {!disabled && key === 'companyName' && errors.companyName && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('recruiterProfile.companyNameMin')}</p>
                        )}
                        {!disabled && key === 'companyWebsite' && errors.companyWebsite && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('recruiterProfile.companyWebsiteMin')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterProfile.notifications')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('recruiterProfile.keepUpdated')}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/notifications')}
                      className="w-full px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      {t('recruiterProfile.notifications')}
                    </button>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest font-bold">
                      {t('recruiterProfile.brandIdentity')}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      {t('recruiterProfile.recruiterAccessEnabled')}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    {loading ? t('recruiterProfile.loading') : t('recruiterProfile.keepUpdated')}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all hover:scale-[1.02]"
                  >
                    {saving ? t('recruiterProfile.saving') : t('recruiterProfile.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
