import { useState, useEffect, useRef } from 'react';
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

export default function PostJob() {
  const { t } = useTranslation();

  const schema = yup.object({
    title: yup.string().trim().required().min(3),
    company: yup.string().trim().required(),
    location: yup.string().trim().required(),
    type: yup.string().required().oneOf(['JOB', 'INTERNSHIP']),
    payment: yup.string().trim(),
    paid: yup.boolean(),
    duration: yup.string().trim().required().min(2),
    compensation: yup.string().trim(),
    description: yup.string().trim().required().min(20).max(5000),
    deadline: yup.mixed().required()
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch
  } = useForm({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      type: 'JOB',
      payment: '',
      paid: false,
      duration: '',
      compensation: '',
      description: '',
      deadline: ''
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const job = watch();

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setIsPaymentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const typeOptions = [
    { value: 'JOB', label: t('recruiterPostJob.typeJob') },
    { value: 'INTERNSHIP', label: t('recruiterPostJob.typeInternship') }
  ];
  const activeType = typeOptions.find(o => o.value === job.type) || typeOptions[0];

  const paymentOptions = [
    { value: '', label: t('recruiterPostJob.paidChoose') },
    { value: 'PAID', label: t('recruiterPostJob.paidYes') },
    { value: 'UNPAID', label: t('recruiterPostJob.paidNo') }
  ];
  const activePayment = paymentOptions.find(o => o.value === job.payment) || paymentOptions[0];

  const toastId = 'recruiter-post-job';

  const onSubmit = async (data) => {
    const title = (data.title || '').trim();
    const company = (data.company || '').trim();
    const location = (data.location || '').trim();
    const description = (data.description || '').trim();
    const deadline = data.deadline;
    const duration = (data.duration || '').trim();
    const compensation = (data.compensation || '').trim();

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      showToast(toastId, 'error', t('recruiterPostJob.deadlineInvalid'));
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      showToast(toastId, 'error', t('recruiterPostJob.deadlinePast'));
      return;
    }

    if (data.type === 'INTERNSHIP' && !String(data.payment || '').trim()) {
      showToast(toastId, 'error', t('recruiterPostJob.paidRequired'));
      return;
    }

    if (data.paid && !compensation) {
      showToast(toastId, 'error', t('recruiterPostJob.compensationRequired'));
      return;
    }

    if (data.paid && compensation.length < 2) {
      showToast(toastId, 'error', t('recruiterPostJob.compensationMin'));
      return;
    }

    setSubmitting(true);
    try {
      const { payment: _payment, ...jobPayload } = data;
      await axios.post('/recruiter/post-job', {
        ...jobPayload,
        location,
        duration: duration || '',
        compensation: data.paid ? compensation : '',
        title,
        company,
        description: sanitizeHtml(description)
      });
      showToast(toastId, 'success', t('recruiterPostJob.posted'));
      setValue('title', '');
      setValue('company', '');
      setValue('location', '');
      setValue('type', 'JOB');
      setValue('payment', '');
      setValue('paid', false);
      setValue('duration', '');
      setValue('compensation', '');
      setValue('description', '');
      setValue('deadline', '');
    } catch (err) {
      showToast(toastId, 'error', t('recruiterPostJob.failedPost'));
      console.error('Post job error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    const values = getValues();
    const title = String(values?.title || '').trim();
    const company = String(values?.company || '').trim();
    const location = String(values?.location || '').trim();
    const description = String(values?.description || '').trim();
    const duration = String(values?.duration || '').trim();
    const deadline = values?.deadline;

    if (!title) return showToast(toastId, 'error', t('recruiterPostJob.titleRequired'));
    if (title.length < 3) return showToast(toastId, 'error', t('recruiterPostJob.titleMin'));
    if (!company) return showToast(toastId, 'error', t('recruiterPostJob.companyRequired'));
    if (!location) return showToast(toastId, 'error', t('recruiterPostJob.locationRequired'));
    if (!description) return showToast(toastId, 'error', t('recruiterPostJob.descriptionRequired'));
    if (description.length < 20) return showToast(toastId, 'error', t('recruiterPostJob.descriptionMin'));
    if (description.length > 5000) return showToast(toastId, 'error', t('recruiterPostJob.descriptionTooLong'));
    if (!duration) return showToast(toastId, 'error', t('recruiterPostJob.durationRequired'));
    if (duration.length < 2) return showToast(toastId, 'error', t('recruiterPostJob.durationMin'));
    if (!deadline) return showToast(toastId, 'error', t('recruiterPostJob.deadlineRequired'));
    return showToast(toastId, 'error', t('recruiterPostJob.failedPost'));
  };

  return (
    <RecruiterPageLayout
      title={t('recruiterPostJob.title')}
      subtitle={t('recruiterPostJob.subtitle')}
      headerClassName="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600"
      maxWidthClassName="max-w-4xl"
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterPostJob.basics')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.jobTitle')}</label>
              <input
                className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                placeholder={t('recruiterPostJob.jobTitlePlaceholder')}
                {...register('title')}
                maxLength={120}
              />
            </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.company')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      placeholder={t('recruiterPostJob.companyPlaceholder')}
                      {...register('company')}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.location')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      placeholder={t('recruiterPostJob.locationPlaceholder')}
                      {...register('location')}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.type')}</label>
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
                                  setValue('payment', 'PAID', { shouldDirty: true });
                                  setValue('paid', true, { shouldDirty: true });
                                } else {
                                  setValue('payment', '', { shouldDirty: true });
                                  setValue('paid', false, { shouldDirty: true });
                                  setValue('compensation', '', { shouldDirty: true });
                                }
                                setIsTypeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${job.type === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              <span className="font-medium">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.paid')}</label>
                    {job.type === 'JOB' ? (
                      <div className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {t('recruiterPostJob.paidYes')}
                      </div>
                    ) : (
                      <div className="relative" ref={paymentDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsPaymentDropdownOpen(prev => !prev)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <span className={`text-sm font-semibold ${job.payment ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{activePayment.label}</span>
                          <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isPaymentDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                            {paymentOptions.map((opt) => (
                              <button
                                key={opt.value || 'choose'}
                                type="button"
                                onClick={() => {
                                  setValue('payment', opt.value, { shouldDirty: true });
                                  setValue('paid', opt.value === 'PAID', { shouldDirty: true });
                                  if (opt.value !== 'PAID') {
                                    setValue('compensation', '', { shouldDirty: true });
                                  }
                                  setIsPaymentDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${job.payment === opt.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <span className="font-medium">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.duration')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      placeholder={t('recruiterPostJob.durationPlaceholder')}
                      {...register('duration')}
                      maxLength={60}
                    />
                  </div>
                  {job.paid ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.compensation')}</label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('recruiterPostJob.compensationPlaceholder')}
                        {...register('compensation')}
                        maxLength={80}
                      />
                    </div>
                  ) : null}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.deadline')}</label>
                    <CustomDateTimePicker
                      value={job.deadline}
                      onChange={(v) => setValue('deadline', v, { shouldDirty: true })}
                      placeholder={t('recruiterPostJob.deadline')}
                      inputClassName="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterPostJob.descriptionSection')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.jobDescription')}</label>
                    <textarea
                      className="w-full min-h-[180px] border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      placeholder={t('recruiterPostJob.descriptionPlaceholder')}
                      {...register('description')}
                      maxLength={5000}
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {(job.description || '').length}/5000
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('recruiterPostJob.hint')}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  {submitting ? t('recruiterPostJob.posting') : t('recruiterPostJob.postJob')}
                </button>
              </div>
            </form>
    </RecruiterPageLayout>
  );
}
