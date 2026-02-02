import { useEffect, useState, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function AdminProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picFile, setPicFile] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/admin/profile');
        setForm(res.data);
      } catch (err) {
        showToast('admin-profile-load', 'error', t('adminProfile.failedLoad'));
        console.error('Admin profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const toastId = 'admin-profile-update';
    const username = (form.username || '').trim();

    if (!username) {
      showToast(toastId, 'error', t('adminProfile.usernameRequired'));
      return;
    }
    if (username.length < 2) {
      showToast(toastId, 'error', t('adminProfile.usernameMin'));
      return;
    }

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
      showToast('admin-profile-picture', 'error', t('resumeUpload.chooseFile'));
      return;
    }
    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', picFile);
      const res = await axios.post('/admin/profile-picture', formData);
      const url = res.data;
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast('admin-profile-picture', 'info', t('adminProfile.updated'));
      setPicFile(null);
    } catch (err) {
      showToast('admin-profile-picture', 'error', t('adminProfile.updateFailed'));
      console.error('Admin profile picture upload error:', err);
    } finally {
      setPicUploading(false);
    }
  };

  const initials = (form.username || t('common.roles.admin'))
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
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
                  <h1 className="text-2xl font-bold text-white">{t('adminProfile.title')}</h1>
                  <p className="text-white/80 text-sm">{form.email || t('common.notAvailable')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  ref={picInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPicFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleProfilePictureAction}
                  disabled={picUploading}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition disabled:opacity-60"
                >
                  {picUploading
                    ? t('common.pleaseWait')
                    : (picFile ? t('common.uploadPhoto') : t('common.choosePhoto'))}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/notifications')}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                >
                  {t('adminProfile.notifications')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.role')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.role || t('common.roles.admin')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.roleHint')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.account')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{t('adminProfile.active')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.accountHint')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('adminProfile.email')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.email || t('common.notAvailable')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.emailHint')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('adminProfile.account')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminProfile.username')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      value={form.username || ''}
                      onChange={handleChange('username')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminProfile.email')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white opacity-80"
                      value={form.email || ''}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('adminProfile.tools')}</h2>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t('adminProfile.openDashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/users')}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t('adminProfile.manageUsers')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t('adminProfile.viewNotifications')}
                  </button>
                  <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('adminProfile.tipTitle')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('adminProfile.tipBody')}</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {loading ? t('common.pleaseWait') : t('adminProfile.auditHint')}
                </div>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? t('adminProfile.saving') : t('adminProfile.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
