import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '@/services/axios';
import { showToast } from '@/services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CustomDateTimePicker } from '@ui/molecules';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import RecruiterPageLayout from '../ui/templates/RecruiterPageLayout';

export default function JobManage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const schema = yup.object({
    title: yup.string().trim().required(),
    company: yup.string().trim().required(),
    location: yup.string().trim().required(),
    type: yup.string().required().oneOf(['JOB', 'INTERNSHIP']),
    paid: yup.boolean(),
    duration: yup.string().trim().required().min(2),
    compensation: yup.string().trim(),
    deadline: yup.mixed().required(),
    description: yup.string().trim().required().min(20).max(5000),
    active: yup.boolean()
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch
  } = useForm({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      type: 'JOB',
      paid: false,
      duration: '',
      compensation: '',
      deadline: '',
      description: '',
      active: true
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const form = watch();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/recruiter/jobs/${id}`);
        setJob(res.data);
        const activeValue = res.data?.active ?? res.data?.isActive;
        reset({
          title: res.data?.title || '',
          company: res.data?.company || '',
          location: res.data?.location || '',
          type: res.data?.type || 'JOB',
          paid: !!res.data?.paid,
          duration: res.data?.duration || '',
          compensation: res.data?.compensation || '',
          deadline: res.data?.deadline || '',
          description: res.data?.description || '',
          active: !!activeValue
        });
      } catch (err) {
        showToast('recruiter-job-load', 'error', t('recruiterJobManage.failedLoad'));
        console.error('Recruiter job load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const typeOptions = [
    { value: 'JOB', label: t('recruiterJobManage.typeJob') },
    { value: 'INTERNSHIP', label: t('recruiterJobManage.typeInternship') }
  ];
  const activeType = typeOptions.find(o => o.value === form.type) || typeOptions[0];

  const save = async (data) => {
    if (!id) return;
    const toastId = `recruiter-job-update-${id}`;

    const title = (data.title || '').trim();
    const company = (data.company || '').trim();
    const location = (data.location || '').trim();
    const description = (data.description || '').trim();
    const deadline = data.deadline;
    const duration = (data.duration || '').trim();
    const compensation = (data.compensation || '').trim();

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return showToast(toastId, 'error', t('recruiterJobManage.deadlineInvalid'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) return showToast(toastId, 'error', t('recruiterJobManage.deadlinePast'));

    if ((data.type === 'JOB' || data.paid) && !compensation) return showToast(toastId, 'error', t('recruiterJobManage.compensationRequired'));

    if ((data.type === 'JOB' || data.paid) && compensation.length < 2) return showToast(toastId, 'error', t('recruiterJobManage.compensationMin'));

    setSaving(true);
    try {
      const res = await axios.put(`/recruiter/jobs/${id}`,
        {
          ...data,
          location,
          deadline,
          duration: duration || '',
          compensation: (data.type === 'JOB' || data.paid) ? compensation : '',
          title,
          company,
          description: sanitizeHtml(description)
        });
      setJob(res.data);
      showToast(toastId, 'info', t('recruiterJobManage.updated'));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterJobManage.failedUpdate'));
      console.error('Recruiter job update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = () => {
    if (!id) return;
    const toastId = `recruiter-job-update-${id}`;
    const values = getValues();
    const title = String(values?.title || '').trim();
    const company = String(values?.company || '').trim();
    const location = String(values?.location || '').trim();
    const description = String(values?.description || '').trim();
    const deadline = values?.deadline;
    const duration = String(values?.duration || '').trim();

    if (!title) return showToast(toastId, 'error', t('recruiterJobManage.titleRequired'));
    if (!company) return showToast(toastId, 'error', t('recruiterJobManage.companyRequired'));
    if (!location) return showToast(toastId, 'error', t('recruiterJobManage.locationRequired'));
    if (!description || description.length < 20) return showToast(toastId, 'error', t('recruiterJobManage.descriptionMin'));
    if (!deadline) return showToast(toastId, 'error', t('recruiterJobManage.deadlineRequired'));
    if (!duration) return showToast(toastId, 'error', t('recruiterJobManage.durationRequired'));
    if (duration.length < 2) return showToast(toastId, 'error', t('recruiterJobManage.durationMin'));
    return showToast(toastId, 'error', t('recruiterJobManage.failedUpdate'));
  };

  return (
    <RecruiterPageLayout
      header={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('recruiterJobManage.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('recruiterJobManage.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
          >
            {t('recruiterJobManage.back')}
          </button>
        </div>
      }
      headerClassName="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"
      maxWidthClassName="max-w-6xl"
    >
      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterJobManage.loading')}</div>
      ) : !job ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterJobManage.jobNotFound')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterJobManage.edit')}</div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.titleLabel')}</label>
                      <input
                        {...register('title')}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.companyLabel')}</label>
                      <input
                        {...register('company')}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.locationLabel')}</label>
                      <input
                        {...register('location')}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.typeLabel')}</label>
                      <div className="relative" ref={typeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsTypeDropdownOpen(prev => !prev)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activeType.label}</span>
                          <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTypeDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                            {typeOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setValue('type', opt.value, { shouldDirty: true });
                                  if (opt.value === 'JOB') {
                                    setValue('paid', true, { shouldDirty: true });
                                  }
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${form.type === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <span className="font-medium">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.deadlineLabel')}</label>
                      <CustomDateTimePicker
                        value={form.deadline}
                        onChange={(v) => setValue('deadline', v, { shouldDirty: true })}
                        placeholder={t('recruiterJobManage.deadlineLabel')}
                        minDate={new Date()}
                        inputClassName="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.paid')}</label>
                      <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2">
                        <input
                          type="checkbox"
                          {...register('paid')}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {form.paid ? t('recruiterJobManage.paidYes') : t('recruiterJobManage.paidNo')}
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.duration')}</label>
                      <input
                        {...register('duration')}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('recruiterJobManage.durationPlaceholder')}
                        maxLength={60}
                      />
                    </div>
                    {form.paid ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.compensation')}</label>
                        <input
                          {...register('compensation')}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          placeholder={t('recruiterJobManage.compensationPlaceholder')}
                          maxLength={80}
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 mt-6">
                      <input
                        id="active"
                        type="checkbox"
                        {...register('active')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('recruiterJobManage.openForApps')}</label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.descriptionLabel')}</label>
                    <textarea
                      {...register('description')}
                      className="w-full min-h-[200px] border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSubmit(save, onInvalid)}
                      disabled={saving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      {saving ? t('recruiterJobManage.saving') : t('recruiterJobManage.saveChanges')}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterJobManage.summary')}</div>
                  <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div><span className="font-semibold">{t('recruiterJobManage.posted')}:</span> {job.createdAt ? new Date(job.createdAt).toLocaleString() : t('common.notAvailable')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.status')}:</span> {(job.active ?? job.isActive) ? t('recruiterJobManage.open') : t('recruiterJobManage.closed')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.recruiter')}:</span> {job.recruiterCompanyName || t('common.notAvailable')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.email')}:</span> {job.recruiterEmail || t('common.notAvailable')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.deadline')}:</span> {job.deadline || t('common.notAvailable')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.payment')}:</span> {job.paid ? t('recruiterJobManage.paidYes') : t('recruiterJobManage.paidNo')}</div>
                    <div><span className="font-semibold">{t('recruiterJobManage.duration')}:</span> {job.duration || t('common.notAvailable')}</div>
                    {job.paid ? (
                      <div><span className="font-semibold">{t('recruiterJobManage.compensation')}:</span> {job.compensation || t('common.notAvailable')}</div>
                    ) : null}
                  </div>
                </div>
        </div>
      )}
    </RecruiterPageLayout>
  );
}
