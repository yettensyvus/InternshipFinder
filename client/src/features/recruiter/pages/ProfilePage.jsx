import { useEffect, useState, useRef } from 'react';
import axios from '@/services/axios';
import { showToast } from '@/services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import RecruiterPageLayout from '../ui/templates/RecruiterPageLayout';

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picFile, setPicFile] = useState(null);
  const [picPreviewUrl, setPicPreviewUrl] = useState('');
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
    if (!picFile) {
      setPicPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(picFile);
    setPicPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [picFile]);

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

  const handleProfilePictureAction = () => {
    if (picUploading) return;
    if (!picFile) {
      picInputRef.current?.click();
      return;
    }
    uploadProfilePicture();
  };

  const uploadProfilePicture = async () => {
    if (!picFile) {
      showToast('recruiter-profile-picture', 'error', t('resumeUpload.chooseFile'));
      return;
    }
    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', picFile);
      const res = await axios.post('/recruiter/profile-picture', formData);
      const url = res.data;
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast('recruiter-profile-picture', 'info', t('recruiterProfile.updated'));
      setPicFile(null);
    } catch (err) {
      showToast('recruiter-profile-picture', 'error', t('recruiterProfile.updateFailed'));
      console.error('Recruiter profile picture upload error:', err);
    } finally {
      setPicUploading(false);
    }
  };

  const initials = (form.companyName || t('common.roles.recruiter'))
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <RecruiterPageLayout
      header={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center overflow-hidden border border-white/20">
              {form.profilePictureUrl ? (
                <img src={form.profilePictureUrl} alt={t('common.user')} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">{initials}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('recruiterProfile.title')}</h1>
              <p className="text-white/80 text-sm">{form.email || t('common.notAvailable')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
            >
              {t('recruiterProfile.notifications')}
            </button>
          </div>
        </div>
      }
      headerClassName="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600"
      maxWidthClassName="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.company')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.companyName || t('common.notAvailable')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.brandIdentity')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.website')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.companyWebsite || t('common.notAvailable')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.whereLearnMore')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterProfile.account')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterProfile.active')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterProfile.recruiterAccessEnabled')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterProfile.companySection')}</h2>
                <div className="space-y-4">
                  {[
                    { key: 'companyName', label: t('recruiterProfile.companyName') },
                    { key: 'companyWebsite', label: t('recruiterProfile.companyWebsite') },
                    { key: 'email', label: t('recruiterProfile.email'), disabled: true }
                  ].map(({ key, label, disabled }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        value={disabled ? (form[key] || '') : undefined}
                        {...(!disabled ? register(key) : {})}
                        disabled={disabled}
                        readOnly={disabled}
                      />
                      {!disabled && key === 'companyName' && errors.companyName ? (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('recruiterProfile.companyNameMin')}</p>
                      ) : null}
                      {!disabled && key === 'companyWebsite' && errors.companyWebsite ? (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('recruiterProfile.companyWebsiteMin')}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="space-y-4">
                  <div>
                    <div className="space-y-3">
                      <input
                        ref={picInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPicFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                        <div className="w-full h-56 bg-white/40 dark:bg-gray-900/40 flex items-center justify-center">
                          {picPreviewUrl || form.profilePictureUrl ? (
                            <img
                              src={picPreviewUrl || form.profilePictureUrl}
                              alt={t('common.user')}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('recruiterProfile.notSet')}</div>
                          )}
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {picFile ? t('common.readyToUpload') : (form.profilePictureUrl ? t('recruiterProfile.uploaded') : t('recruiterProfile.notSet'))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleProfilePictureAction}
                          disabled={picUploading}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-60"
                        >
                          {picUploading
                            ? t('common.pleaseWait')
                            : (picFile ? t('common.uploadPhoto') : t('common.choosePhoto'))}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {loading ? t('recruiterProfile.loading') : t('recruiterProfile.keepUpdated')}
                </div>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? t('recruiterProfile.saving') : t('recruiterProfile.saveChanges')}
                </button>
              </div>
            </form>
    </RecruiterPageLayout>
  );
}
