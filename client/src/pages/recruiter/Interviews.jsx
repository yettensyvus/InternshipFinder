import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import {
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function Interviews() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [hiring, setHiring] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/recruiter/applications/interviews');
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast('recruiter-interviews-load', 'error', t('recruiterInterviews.failedLoad', { defaultValue: 'Failed to load interviews' }));
        console.error('Interviews fetch error:', err);
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

  const getInitials = (value) => {
    const v = String(value || '').trim();
    if (!v) return '?';
    const parts = v.split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (a + b).toUpperCase() || '?';
  };

  const handleHire = async () => {
    if (!selectedApp) return;
    setHiring(true);
    try {
      await axios.put(`/recruiter/applications/${selectedApp.id}?status=HIRED`);
      showToast('hire-candidate', 'success', t('recruiterShortlist.hiredSuccess'));
      setApplications(prev => prev.filter(a => a.id !== selectedApp.id));
      setSelectedApp(null);
    } catch (err) {
      showToast('hire-candidate', 'error', t('recruiterShortlist.failedHire'));
    } finally {
      setHiring(false);
    }
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
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-blue-600 flex-shrink-0">
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 pb-2">
              {t('recruiterInterviews.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('recruiterInterviews.subtitle')}
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
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="text-gray-600 dark:text-gray-300">{t('recruiterInterviews.noInterviews')}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Interview List */}
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
                          className={`w-full text-left bg-white dark:bg-gray-900/40 border rounded-2xl p-4 shadow-sm transition-colors ${isActive ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-200/70 dark:ring-blue-900/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold flex-shrink-0 overflow-hidden">
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

                {/* Column 2: Details & Hiring */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full overflow-y-auto">
                    {!selectedApp ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10 text-gray-600 dark:text-gray-400">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <CalendarIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        {t('recruiterApplications.selectStudentHint')}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">
                            {selectedApp.student?.name}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
                            {selectedApp.jobTitle} ({selectedApp.jobCompany})
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 space-y-2">
                          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {t('recruiterShortlist.alreadyScheduled')}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <p>📅 <strong>{new Date(selectedApp.interviewAt).toLocaleString()}</strong></p>
                            <p>📍 <strong>{selectedApp.interviewLocation}</strong></p>
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

                        
                          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                            <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <UserPlusIcon className="h-4 w-4" />
                              {t('recruiterShortlist.hiring')}
                            </h3>
                            <div className="space-y-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('recruiterShortlist.hiringHint')}</p>
                              <button
                                onClick={handleHire}
                                disabled={hiring}
                                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
                              >
                                {hiring ? t('common.pleaseWait') : t('recruiterShortlist.hireNow')}
                              </button>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: CV Viewer */}
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
