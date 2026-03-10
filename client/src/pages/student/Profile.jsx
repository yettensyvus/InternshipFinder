import { useState, useEffect, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const { t } = useTranslation();
  const { updateAvatar } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [applicationsCount, setApplicationsCount] = useState(0);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef(null);

  const schema = yup.object({
    name: yup.string().trim().required().min(2),
    phone: yup.string().trim(),
    yearOfPassing: yup.string().trim()
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      yearOfPassing: '',
      college: '',
      branch: ''
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, appsRes] = await Promise.all([
          axios.get('/student/profile'),
          axios.get('/student/applications')
        ]);
        setForm(profileRes.data);
        setApplicationsCount(Array.isArray(appsRes.data) ? appsRes.data.length : 0);
        reset({
          name: profileRes.data?.name || '',
          phone: profileRes.data?.phone || '',
          yearOfPassing: profileRes.data?.yearOfPassing ? String(profileRes.data?.yearOfPassing) : '',
          college: profileRes.data?.college || '',
          branch: profileRes.data?.branch || ''
        });
      } catch (err) {
        showToast('student-profile-load', 'error', t('studentProfile.failedLoad'));
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSubmit = async (data) => {
    const toastId = 'student-profile-update';
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const yearOfPassing = (data.yearOfPassing || '').toString().trim();
    const college = (data.college || '').trim();
    const branch = (data.branch || '').trim();
    if (phone && phone.length < 6) return showToast(toastId, 'error', t('studentProfile.phoneMin'));
    if (yearOfPassing && !/^\d{4}$/.test(yearOfPassing)) return showToast(toastId, 'error', t('studentProfile.yearInvalid'));

    setSaving(true);
    try {
      await axios.put('/student/profile', {
        ...form,
        name,
        phone,
        college,
        branch,
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

  const onInvalid = () => {
    const toastId = 'student-profile-update';
    if (errors?.name) {
      showToast(toastId, 'error', t('studentProfile.nameMin'));
      return;
    }
    showToast(toastId, 'error', t('studentProfile.nameRequired'));
  };

  const uploadProfilePicture = async (file) => {
    if (!file) return;
    setPicUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/student/profile-picture', formData);
      const url = res.data;
      setForm(prev => ({ ...prev, profilePictureUrl: url }));
      updateAvatar?.(url);
      showToast('student-profile-picture', 'info', t('studentProfile.updated'));
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

  const ResumePanel = ({ resumeUrl }) => {
    if (!resumeUrl) {
      return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('recruiterApplications.resume')}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.noResume')}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-white truncate">{t('recruiterApplications.resume')}</div>
            </div>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white transition-colors flex-shrink-0"
              title={t('recruiterStudents.openResume')}
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="flex-1 min-h-[520px] bg-gray-100 dark:bg-gray-800">
          <iframe
            title="CV Preview"
            src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 pt-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-6 py-8 shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-blue-200 mb-2 pb-1">
                    {t('studentProfile.title')}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base max-w-3xl truncate px-2 sm:px-0">{form.email || t('common.notAvailable')}</p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (picUploading) return;
                      picInputRef.current?.click();
                    }}
                    disabled={picUploading}
                    className="group relative w-23 h-23 rounded-2xl bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center disabled:opacity-60"
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadProfilePicture(file);
                      e.target.value = '';
                    }}
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
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.applications')}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{applicationsCount}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('studentProfile.totalJobsApplied')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.institution')}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white truncate">{form.college || t('common.notAvailable')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">{form.branch ? `${form.branch}` : t('studentProfile.addBranch')}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('studentProfile.graduation')}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{form.yearOfPassing || t('common.notAvailable')}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('studentProfile.keepUpdated')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
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
                          value={disabled ? (form[key] || '') : undefined}
                          {...(!disabled ? register(key) : {})}
                          disabled={disabled}
                          readOnly={disabled}
                        />
                        {!disabled && key === 'name' && errors.name ? (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t('studentProfile.nameMin')}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
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
                          {...register(key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 h-full min-h-[600px]">
                  <ResumePanel resumeUrl={resumeUrl} />
                </div>

                <div className="lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left order-2 sm:order-1">
                    {loading ? t('studentProfile.loading') : t('studentProfile.checkDetailsHint')}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 order-1 sm:order-2"
                  >
                    {saving ? t('studentProfile.saving') : t('studentProfile.saveChanges')}
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