import { useEffect, useState, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getInitials } from '../../utils/getInitials';
import { uploadPhoto } from '../../services/uploads';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, ChartBarIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { adminProfileSchema } from '../../schemas/adminProfileSchema';

export default function AdminProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { username: '' },
    resolver: yupResolver(adminProfileSchema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/admin/profile');
        setForm(res.data);
        reset({ username: res.data?.username || '' });
      } catch (err) {
        showToast('admin-profile-load', 'error', t('adminProfile.failedLoad'));
        console.error('Admin profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSubmit = async (data) => {
    const toastId = 'admin-profile-update';
    const username = (data.username || '').trim();

    setSaving(true);
    try {
      await axios.put('/admin/profile', {
        ...form,
        username
      });
      showToast(toastId, 'info', t('adminProfile.updated'));
    } catch (err) {
      showToast(toastId, 'error', t('adminProfile.updateFailed'));
      console.error('Admin profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => {
    const toastId = 'admin-profile-update';
    showToast(toastId, 'error', errors?.username ? t('adminProfile.usernameMin') : t('adminProfile.usernameRequired'));
  };

  const handleProfilePictureAction = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPicUploading(true);
    try {
      const url = await uploadPhoto({ endpoint: '/admin/profile-picture', file });
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast('admin-profile-picture', 'info', t('adminProfile.updated'));
    } catch (err) {
      showToast('admin-profile-picture', 'error', t('adminProfile.updateFailed'));
      console.error('Admin profile picture upload error:', err);
    } finally {
      setPicUploading(false);
    }
  };

  const initials = getInitials(form.username || t('common.roles.admin'), { fallback: '?' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-pink-200 mb-2 pb-1">
                    {t('adminProfile.title')}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base max-w-3xl truncate">{form.email || t('common.notAvailable')}</p>
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
                    onChange={handleProfilePictureAction}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.role')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.role || t('common.roles.admin')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.roleHint')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.account')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{t('adminProfile.active')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.accountHint')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.email')}</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{form.email || t('common.notAvailable')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.emailHint')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('adminProfile.account')}</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'username', label: t('adminProfile.username'), icon: UserIcon },
                      { key: 'email', label: t('adminProfile.email'), icon: EnvelopeIcon, disabled: true }
                    ].map(({ key, label, icon: Icon, disabled }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Icon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            className={`w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2 text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-red-500/20 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                            value={disabled ? (form[key] || '') : undefined}
                            {...(!disabled ? register(key) : {})}
                            disabled={disabled}
                            readOnly={disabled}
                          />
                        </div>
                        {!disabled && key === 'username' && errors.username && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('adminProfile.usernameMin')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('adminProfile.tools')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: t('adminProfile.openDashboard'), path: '/admin/dashboard', icon: ChartBarIcon },
                      { label: t('adminProfile.manageUsers'), path: '/admin/users', icon: UserIcon },
                      { label: t('adminProfile.viewNotifications'), path: '/notifications', icon: ShieldCheckIcon },
                      { label: t('adminDashboard.systemLogs'), path: '/admin/logs', icon: CommandLineIcon }
                    ].map(({ label, path, icon: Icon }) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => navigate(path)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                      >
                        <Icon className="h-5 w-5 text-gray-400" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">{t('adminProfile.tipTitle')}</div>
                    <p className="text-xs text-red-700/70 dark:text-red-300/60 leading-relaxed">{t('adminProfile.tipBody')}</p>
                  </div>
                </div>

                <div className="lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    {loading ? t('common.pleaseWait') : t('adminProfile.auditHint')}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all hover:scale-[1.02]"
                  >
                    {saving ? t('adminProfile.saving') : t('adminProfile.saveChanges')}
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
