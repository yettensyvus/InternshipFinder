import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function JobManage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [job, setJob] = useState(null);
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    type: '',
    paid: false,
    duration: '',
    compensation: '',
    deadline: '',
    description: '',
    active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/recruiter/jobs/${id}`);
        setJob(res.data);
        const activeValue = res.data?.active ?? res.data?.isActive;
        setForm({
          title: res.data?.title || '',
          company: res.data?.company || '',
          location: res.data?.location || '',
          type: res.data?.type || '',
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

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'paid' && !checked) {
        next.compensation = '';
      }
      if (name === 'type' && value === 'JOB') {
        next.paid = true;
      }
      return next;
    });
  };

  const save = async () => {
    if (!id) return;
    const toastId = `recruiter-job-update-${id}`;
    const title = (form.title || '').trim();
    const company = (form.company || '').trim();
    const location = (form.location || '').trim();
    const description = (form.description || '').trim();
    const deadline = form.deadline;
    const duration = (form.duration || '').trim();
    const compensation = (form.compensation || '').trim();

    if (!title) return showToast(toastId, 'error', t('recruiterJobManage.titleRequired'));
    if (!company) return showToast(toastId, 'error', t('recruiterJobManage.companyRequired'));
    if (!location) return showToast(toastId, 'error', t('recruiterJobManage.locationRequired'));
    if (!description || description.length < 20) return showToast(toastId, 'error', t('recruiterJobManage.descriptionMin'));

    if (!deadline) return showToast(toastId, 'error', t('recruiterJobManage.deadlineRequired'));
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return showToast(toastId, 'error', t('recruiterJobManage.deadlineInvalid'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) return showToast(toastId, 'error', t('recruiterJobManage.deadlinePast'));

    if (!duration) return showToast(toastId, 'error', t('recruiterJobManage.durationRequired'));

    if (duration && duration.length < 2) return showToast(toastId, 'error', t('recruiterJobManage.durationMin'));

    if ((form.type === 'JOB' || form.paid) && !compensation) return showToast(toastId, 'error', t('recruiterJobManage.compensationRequired'));

    if ((form.type === 'JOB' || form.paid) && compensation.length < 2) return showToast(toastId, 'error', t('recruiterJobManage.compensationMin'));

    setSaving(true);
    try {
      const res = await axios.put(`/recruiter/jobs/${id}`, {
        ...form,
        location,
        deadline,
        duration: duration || '',
        compensation: (form.type === 'JOB' || form.paid) ? compensation : '',
        title,
        company,
        description
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
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
          </div>

          <div className="p-6">
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
                        name="title"
                        value={form.title}
                        onChange={onChange}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.companyLabel')}</label>
                      <input
                        name="company"
                        value={form.company}
                        onChange={onChange}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.locationLabel')}</label>
                      <input
                        name="location"
                        value={form.location}
                        onChange={onChange}
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
                                  setForm(prev => {
                                    const next = { ...prev, type: opt.value };
                                    if (opt.value === 'JOB') {
                                      next.paid = true;
                                    }
                                    return next;
                                  });
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
                      <input
                        type="date"
                        name="deadline"
                        value={form.deadline}
                        onChange={onChange}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.paid')}</label>
                      <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2">
                        <input
                          type="checkbox"
                          name="paid"
                          checked={!!form.paid}
                          onChange={onChange}
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
                        name="duration"
                        value={form.duration}
                        onChange={onChange}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                        placeholder={t('recruiterJobManage.durationPlaceholder')}
                        maxLength={60}
                      />
                    </div>
                    {form.paid ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.compensation')}</label>
                        <input
                          name="compensation"
                          value={form.compensation}
                          onChange={onChange}
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
                        name="active"
                        checked={form.active}
                        onChange={onChange}
                        className="h-4 w-4"
                      />
                      <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('recruiterJobManage.openForApps')}</label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recruiterJobManage.descriptionLabel')}</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={onChange}
                      className="w-full min-h-[200px] border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={save}
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
          </div>
        </div>
      </div>
    </div>
  );
}
