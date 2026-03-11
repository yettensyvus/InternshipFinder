import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import {
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

export default function Shortlist() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [scheduling, setSubmitting] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const pageSize = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/recruiter/applications/shortlisted');
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast('recruiter-shortlist-load', 'error', t('recruiterShortlist.failedLoad'));
        console.error('Shortlist fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const filtered = applications.filter(app => {
    const q = query.toLowerCase().trim();
    const name = app.student?.name || '';
    const job = app.jobTitle || '';
    const email = app.student?.email || '';
    return !q || name.toLowerCase().includes(q) || job.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const handleScheduleInterview = async () => {
    if (!selectedApp || !interviewDate || !interviewLocation) {
      showToast('schedule-interview', 'error', t('recruiterShortlist.formRequired'));
      return;
    }

    const selectedDate = new Date(interviewDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      showToast('schedule-interview', 'error', t('recruiterShortlist.invalidDate'));
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/recruiter/applications/${selectedApp.id}/schedule-interview`, {
        interviewAt: new Date(interviewDate),
        location: interviewLocation
      });
      showToast('schedule-interview', 'success', t('recruiterShortlist.interviewScheduled'));
      
      const updatedStatus = 'INTERVIEW_SCHEDULED';
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: updatedStatus, interviewAt: interviewDate, interviewLocation } : a));
      setSelectedApp(prev => ({ ...prev, status: updatedStatus, interviewAt: interviewDate, interviewLocation }));
    } catch (err) {
      showToast('schedule-interview', 'error', t('recruiterShortlist.failedSchedule'));
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (value) => {
    const v = String(value || '').trim();
    if (!v) return '?';
    const parts = v.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (a + b).toUpperCase() || '?';
  };

  const ResumePanel = ({ resumeUrl }) => {
    if (!resumeUrl) {
      return (
        <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
          <DocumentTextIcon className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm">{t('recruiterApplications.noResume')}</p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <DocumentTextIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('recruiterApplications.resume')}</span>
            </div>
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white transition-colors">
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-800">
          <iframe title="CV Preview" src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-400 dark:via-amber-400 dark:to-yellow-400 pb-2">
              {t('recruiterShortlist.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              {t('recruiterShortlist.subtitle')}
            </p>
          </div>

          <div className="w-full md:w-[420px]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('recruiterStudents.search')}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('recruiterStudents.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('recruiterStudents.count', { count: filtered.length })}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('common.pleaseWait')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-300">{t('recruiterApplications.noAppsYet')}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Shortlist */}
                <div className="lg:col-span-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('recruiterStudents.page', { page, total: totalPages })}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-60"
                        >
                          {t('recruiterStudents.prev')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-60"
                        >
                          {t('recruiterStudents.next')}
                        </button>
                      </div>
                    </div>

                    {paged.map((app) => {
                      const isActive = selectedApp?.id === app.id;
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className={`w-full text-left bg-white dark:bg-gray-900/40 border rounded-2xl p-4 shadow-sm transition-colors ${isActive ? 'border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-200/70 dark:ring-emerald-900/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold flex-shrink-0 overflow-hidden">
                              {app.student?.profilePictureUrl ? (
                                <img src={app.student.profilePictureUrl} className="h-full w-full object-cover" alt="" />
                              ) : getInitials(app.student?.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {app.student?.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {app.jobTitle}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Actions */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full overflow-y-auto">
                    {!selectedApp ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10 text-gray-600 dark:text-gray-400">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        {t('recruiterApplications.selectStudentHint')}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">
                            {selectedApp.student?.name}
                          </div>
                          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate">
                            {selectedApp.jobTitle} ({selectedApp.jobCompany})
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium break-all">{selectedApp.student?.email}</div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('recruiterApplications.phone')}</div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">{selectedApp.student?.phone || t('common.notAvailable')}</div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                              <CalendarIcon className="h-4 w-4" />
                              {t('recruiterShortlist.interview')}
                            </h3>
                            <div className="space-y-3">
                              {selectedApp.status === 'INTERVIEW_SCHEDULED' ? (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-2">
                                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    ✅ {t('recruiterShortlist.alreadyScheduled')}
                                  </div>
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>📅 <strong>{new Date(selectedApp.interviewAt).toLocaleString()}</strong></p>
                                    <p>📍 <strong>{selectedApp.interviewLocation}</strong></p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 gap-2">
                                    <CustomDateTimePicker
                                      value={interviewDate}
                                      onChange={(v) => setInterviewDate(v)}
                                      placeholder={t('recruiterShortlist.interviewDatePlaceholder')}
                                      minDate={(() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + 1);
                                        return d;
                                      })()}
                                      inputClassName="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder={t('recruiterShortlist.locationPlaceholder')}
                                      value={interviewLocation}
                                      onChange={(e) => setInterviewLocation(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                  </div>
                                  <button
                                    onClick={handleScheduleInterview}
                                    disabled={scheduling}
                                    className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                                  >
                                    {scheduling ? t('common.pleaseWait') : t('recruiterShortlist.sendInvite')}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: CV */}
                <div className="lg:col-span-5 h-full min-h-[600px]">
                  <ResumePanel resumeUrl={selectedApp?.student?.resumeUrl} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}