import { useState, useEffect, useRef } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

export default function PostJob() {
  const { t } = useTranslation();
  const [job, setJob] = useState({
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
  });

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJob(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };

      if (name === 'payment') {
        next.paid = value === 'PAID';
        if (value !== 'PAID') {
          next.compensation = '';
        }
      }

      return next;
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = (job.title || '').trim();
    const company = (job.company || '').trim();
    const location = (job.location || '').trim();
    const description = (job.description || '').trim();
    const deadline = job.deadline;
    const duration = (job.duration || '').trim();
    const compensation = (job.compensation || '').trim();

    if (!title) {
      showToast(toastId, 'error', t('recruiterPostJob.titleRequired'));
      return;
    }
    if (title.length < 3) {
      showToast(toastId, 'error', t('recruiterPostJob.titleMin'));
      return;
    }
    if (!company) {
      showToast(toastId, 'error', t('recruiterPostJob.companyRequired'));
      return;
    }
    if (!location) {
      showToast(toastId, 'error', t('recruiterPostJob.locationRequired'));
      return;
    }
    if (!description) {
      showToast(toastId, 'error', t('recruiterPostJob.descriptionRequired'));
      return;
    }
    if (description.length < 20) {
      showToast(toastId, 'error', t('recruiterPostJob.descriptionMin'));
      return;
    }
    if (description.length > 5000) {
      showToast(toastId, 'error', t('recruiterPostJob.descriptionTooLong'));
      return;
    }
    if (!deadline) {
      showToast(toastId, 'error', t('recruiterPostJob.deadlineRequired'));
      return;
    }

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

    if (job.type === 'INTERNSHIP' && !job.payment) {
      showToast(toastId, 'error', t('recruiterPostJob.paidRequired'));
      return;
    }

    if (!duration) {
      showToast(toastId, 'error', t('recruiterPostJob.durationRequired'));
      return;
    }

    if (duration && duration.length < 2) {
      showToast(toastId, 'error', t('recruiterPostJob.durationMin'));
      return;
    }

    if (job.paid && !compensation) {
      showToast(toastId, 'error', t('recruiterPostJob.compensationRequired'));
      return;
    }

    if (job.paid && compensation.length < 2) {
      showToast(toastId, 'error', t('recruiterPostJob.compensationMin'));
      return;
    }

    setSubmitting(true);
    try {
      const { payment: _payment, ...jobPayload } = job;
      await axios.post('/recruiter/post-job', {
        ...jobPayload,
        location,
        duration: duration || '',
        compensation: job.paid ? compensation : '',
        title,
        company,
        description
      });
      showToast(toastId, 'success', t('recruiterPostJob.posted'));
      setJob({ title: '', company: '', location: '', type: 'JOB', payment: '', paid: false, duration: '', compensation: '', description: '', deadline: '' });
    } catch (err) {
      showToast(toastId, 'error', t('recruiterPostJob.failedPost'));
      console.error('Post job error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white">{t('recruiterPostJob.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('recruiterPostJob.subtitle')}</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('recruiterPostJob.basics')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.jobTitle')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      name="title"
                      placeholder={t('recruiterPostJob.jobTitlePlaceholder')}
                      value={job.title}
                      onChange={handleChange}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.company')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      name="company"
                      placeholder={t('recruiterPostJob.companyPlaceholder')}
                      value={job.company}
                      onChange={handleChange}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.location')}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      name="location"
                      placeholder={t('recruiterPostJob.locationPlaceholder')}
                      value={job.location}
                      onChange={handleChange}
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
                                setJob(prev => {
                                  const next = { ...prev, type: opt.value };
                                  if (opt.value === 'JOB') {
                                    next.payment = 'PAID';
                                    next.paid = true;
                                  } else {
                                    next.payment = '';
                                    next.paid = false;
                                    next.compensation = '';
                                  }
                                  return next;
                                });
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
                                  setJob(prev => {
                                    const next = { ...prev, payment: opt.value, paid: opt.value === 'PAID' };
                                    if (opt.value !== 'PAID') {
                                      next.compensation = '';
                                    }
                                    return next;
                                  });
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
                      name="duration"
                      placeholder={t('recruiterPostJob.durationPlaceholder')}
                      value={job.duration}
                      onChange={handleChange}
                      maxLength={60}
                    />
                  </div>
                  {job.paid ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.compensation')}</label>
                      <input
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        name="compensation"
                        placeholder={t('recruiterPostJob.compensationPlaceholder')}
                        value={job.compensation}
                        onChange={handleChange}
                        maxLength={80}
                      />
                    </div>
                  ) : null}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterPostJob.deadline')}</label>
                    <CustomDateTimePicker
                      value={job.deadline}
                      onChange={(v) => setJob((prev) => ({ ...prev, deadline: v }))}
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
                      name="description"
                      placeholder={t('recruiterPostJob.descriptionPlaceholder')}
                      value={job.description}
                      onChange={handleChange}
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
          </div>
        </div>
      </div>
    </div>
  );
}
