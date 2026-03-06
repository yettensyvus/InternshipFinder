import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 pb-2">
              {t('recruiterJobManage.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('recruiterJobManage.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('recruiterJobManage.edit')}
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('common.pleaseWait')}</div>
            ) : !job ? (
              <div className="text-gray-600 dark:text-gray-400">{t('recruiterJobManage.jobNotFound')}</div>
            ) : (
              <form onSubmit={handleSubmit(save, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Inputs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.titleLabel')}</label>
                      <input
                        {...register('title')}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.companyLabel')}</label>
                      <input
                        {...register('company')}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.locationLabel')}</label>
                      <input
                        {...register('location')}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.typeLabel')}</label>
                      <div className="relative" ref={typeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsTypeDropdownOpen(prev => !prev)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                        >
                          <span className="text-sm font-semibold">{activeType.label}</span>
                          <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTypeDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                            {typeOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setValue('type', opt.value, { shouldDirty: true });
                                  if (opt.value === 'JOB') {
                                    setValue('paid', true, { shouldDirty: true });
                                  } else if (opt.value === 'INTERNSHIP' && form.type === 'JOB') {
                                    setValue('paid', false, { shouldDirty: true });
                                    setValue('compensation', '', { shouldDirty: true });
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.deadlineLabel')}</label>
                      <CustomDateTimePicker
                        value={form.deadline}
                        onChange={(v) => setValue('deadline', v, { shouldDirty: true })}
                        placeholder={t('recruiterJobManage.deadlineLabel')}
                        minDate={new Date()}
                        inputClassName="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.paid')}</label>
                      {form.type === 'JOB' ? (
                        <div className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-inner">
                          {t('recruiterJobManage.paidYes')}
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 px-4 py-2 cursor-pointer w-full shadow-sm">
                          <input
                            type="checkbox"
                            {...register('paid')}
                            className="h-4 w-4 accent-violet-600"
                          />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {form.paid ? t('recruiterJobManage.paidYes') : t('recruiterJobManage.paidNo')}
                          </span>
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.duration')}</label>
                      <input
                        {...register('duration')}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                        placeholder={t('recruiterJobManage.durationPlaceholder')}
                        maxLength={60}
                      />
                    </div>
                    {form.paid && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.compensation')}</label>
                        <input
                          {...register('compensation')}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                          placeholder={t('recruiterJobManage.compensationPlaceholder')}
                          maxLength={80}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      id="active"
                      type="checkbox"
                      {...register('active')}
                      className="h-5 w-5 accent-violet-600 cursor-pointer"
                    />
                    <label htmlFor="active" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer">{t('recruiterJobManage.openForApps')}</label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition disabled:opacity-50"
                    >
                      {saving ? t('recruiterJobManage.saving') : t('recruiterJobManage.saveChanges')}
                    </button>
                  </div>
                </div>

                {/* Right Side: Description & Summary */}
                <div className="lg:col-span-5 space-y-6 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recruiterJobManage.descriptionLabel')}</label>
                    <div className="flex-1 min-h-[300px] relative">
                      <textarea
                        {...register('description')}
                        className="w-full h-full min-h-[300px] px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
                    <h3 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-3">
                      {t('recruiterJobManage.summary')}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span className="font-medium">{t('recruiterJobManage.posted')}:</span>
                        <span className="font-bold">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : t('common.notAvailable')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('recruiterJobManage.status')}:</span>
                        <span className={`font-bold ${(job.active ?? job.isActive) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {(job.active ?? job.isActive) ? t('recruiterJobManage.open') : t('recruiterJobManage.closed')}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-medium flex-shrink-0">{t('recruiterJobManage.recruiter')}:</span>
                        <span className="font-bold text-right truncate">{job.recruiterCompanyName || t('common.notAvailable')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
