import { useEffect, useState, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPicUploading(true);
    const toastId = 'recruiter-profile-picture';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/recruiter/profile-picture', formData);
      const url = res.data;
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

  const initials = (form.companyName || t('common.roles.recruiter'))
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 pb-2">
              {t('recruiterProfile.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {form.email || t('common.notAvailable')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              {t('recruiterProfile.notifications')}
            </button>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('recruiterProfile.companySection')}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('recruiterProfile.company')}</p>
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.companyName || t('common.notAvailable')}</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('recruiterProfile.brandIdentity')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('recruiterProfile.website')}</p>
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.companyWebsite || t('common.notAvailable')}</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('recruiterProfile.whereLearnMore')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('recruiterProfile.account')}</p>
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{t('recruiterProfile.active')}</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('recruiterProfile.recruiterAccessEnabled')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'companyName', label: t('recruiterProfile.companyName') },
                    { key: 'companyWebsite', label: t('recruiterProfile.companyWebsite') },
                    { key: 'email', label: t('recruiterProfile.email'), disabled: true }
                  ].map(({ key, label, disabled }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</label>
                      <input
                        className={`w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-800' : ''}`}
                        value={disabled ? (form[key] || '') : undefined}
                        {...(!disabled ? register(key) : {})}
                        disabled={disabled}
                        readOnly={disabled}
                      />
                      {!disabled && key === 'companyName' && errors.companyName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{t('recruiterProfile.companyNameMin')}</p>
                      )}
                      {!disabled && key === 'companyWebsite' && errors.companyWebsite && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{t('recruiterProfile.companyWebsiteMin')}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {loading ? t('recruiterProfile.loading') : t('recruiterProfile.keepUpdated')}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="px-8 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition disabled:opacity-50"
                  >
                    {saving ? t('recruiterProfile.saving') : t('recruiterProfile.saveChanges')}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="space-y-4">
                  <label className="block text-sm text-center font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterProfile.profilePicture')}</label>
                  <div 
                    onClick={() => !picUploading && picInputRef.current?.click()}
                    className={`relative group rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 aspect-square max-w-[320px] mx-auto overflow-hidden cursor-pointer hover:border-violet-500 transition-all ${picUploading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <input
                      ref={picInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {form.profilePictureUrl ? (
                      <img src={form.profilePictureUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-4xl font-bold text-violet-300 dark:text-violet-700 mb-2">{initials}</span>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('common.choosePhoto')}</p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">{picUploading ? t('common.pleaseWait') : t('common.uploadPhoto')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-2 px-4 italic">{t('recruiterProfile.uploadHint')}</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
