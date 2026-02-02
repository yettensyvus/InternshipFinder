import { useState, useEffect, useRef } from 'react';
import axios from '../../services/axios';
import { showLoadingToast, showToast } from '../../services/toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [picFile, setPicFile] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, appsRes] = await Promise.all([
          axios.get('/student/profile'),
          axios.get('/student/applications')
        ]);
        setForm(profileRes.data);
        setApplicationsCount(Array.isArray(appsRes.data) ? appsRes.data.length : 0);
      } catch (err) {
        showToast('student-profile-load', 'error', t('studentProfile.failedLoad'));
        console.error('Profile fetch error:', err);
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

    const toastId = 'student-profile-update';
    const name = (form.name || '').trim();
    const phone = (form.phone || '').trim();
    const yearOfPassing = (form.yearOfPassing || '').toString().trim();

    if (!name) {
      showToast(toastId, 'error', t('studentProfile.nameRequired'));
      return;
    }
    if (name.length < 2) {
      showToast(toastId, 'error', t('studentProfile.nameMin'));
      return;
    }
    if (phone && phone.length < 6) {
      showToast(toastId, 'error', t('studentProfile.phoneMin'));
      return;
    }
    if (yearOfPassing && !/^\d{4}$/.test(yearOfPassing)) {
      showToast(toastId, 'error', t('studentProfile.yearInvalid'));
      return;
    }

    setSaving(true);
    try {
      await axios.put('/student/profile', {
        ...form,
        name,
        phone,
        yearOfPassing: yearOfPassing || ''
      });
      showToast(toastId, 'info', t('studentProfile.updated'));
    } catch (err) {
      showToast(toastId, 'error', t('studentProfile.updateFailed'));
      console.error('Profile update error:', err);
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
      showToast('student-profile-picture', 'error', t('resumeUpload.chooseFile'));
      return;
    }
    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', picFile);
      const res = await axios.post('/student/profile-picture', formData);
      const url = res.data;
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast('student-profile-picture', 'info', t('studentProfile.updated'));
      setPicFile(null);
    } catch (err) {
      showToast('student-profile-picture', 'error', t('studentProfile.updateFailed'));
      console.error('Student profile picture upload error:', err);
    } finally {
      setPicUploading(false);
    }
  };

  const initials = (form.name || t('common.roles.student'))
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const resumeUrl = form.resumeUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
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
                  <h1 className="text-2xl font-bold text-white">{t('studentProfile.title')}</h1>
                  <p className="text-white/80 text-sm">{form.email || t('common.notAvailable')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                  >
                    {t('studentProfile.viewResume')}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => showToast('student-profile-no-resume', 'info', t('studentProfile.noResumeHint'))}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                  >
                    {t('studentProfile.noResume')}
                  </button>
                )}
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
                  {t('notificationsPage.title')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.applications')}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{applicationsCount}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('studentProfile.totalJobsApplied')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.institution')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.college || t('common.notAvailable')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{form.branch ? `${form.branch}` : t('studentProfile.addBranch')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.graduation')}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.yearOfPassing || t('common.notAvailable')}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('studentProfile.keepUpdated')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('studentProfile.personal')}</h2>
                <div className="space-y-4">
                  {[
                    { key: 'name', label: t('studentProfile.fullName') },
                    { key: 'phone', label: t('studentProfile.phone') },
                    { key: 'email', label: t('studentProfile.email'), disabled: true }
                  ].map(({ key, label, disabled }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        value={form[key] || ''}
                        onChange={disabled ? undefined : handleChange(key)}
                        disabled={disabled}
                        readOnly={disabled}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('studentProfile.education')}</h2>
                <div className="space-y-4">
                  {[
                    { key: 'college', label: t('studentProfile.institution') },
                    { key: 'branch', label: t('studentProfile.branchDepartment') },
                    { key: 'yearOfPassing', label: t('studentProfile.yearOfPassing') }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        value={form[key] || ''}
                        onChange={handleChange(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {loading ? t('studentProfile.loading') : t('studentProfile.checkDetailsHint')}
                </div>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? t('studentProfile.saving') : t('studentProfile.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
