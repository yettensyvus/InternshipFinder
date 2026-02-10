import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Applications() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const jobDropdownRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/recruiter/my-jobs');
        setJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast('recruiter-jobs-load', 'error', t('recruiterApplications.failedLoadJobs'));
        console.error('Recruiter jobs fetch error:', err);
      } finally {
        setJobsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchApplications = async (jobId) => {
    if (!jobId) {
      return;
    }
    const toastId = `recruiter-apps-load-${jobId}`;
    setSelectedJobId(jobId);
    setSelectedApp(null);
    setAppsLoading(true);
    try {
      const res = await axios.get(`/recruiter/applications/${jobId}`);
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(toastId, 'error', t('recruiterApplications.failedLoadApps'));
      console.error('Applications fetch error:', err);
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    const toastId = `recruiter-app-status-${appId || 'unknown'}`;
    if (!appId) return;
    try {
      const allowed = ['SHORTLISTED', 'REJECTED'];
      if (!allowed.includes(status)) {
        showToast(toastId, 'error', t('recruiterApplications.invalidStatus'));
        return;
      }
      setUpdatingStatusId(appId);
      await axios.put(`/recruiter/applications/${appId}?status=${status}`);
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status } : a)
      );
      setSelectedApp(prev => (prev && prev.id === appId ? { ...prev, status } : prev));
      showToast(toastId, 'info', t('recruiterApplications.statusUpdated', { status }));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterApplications.failedUpdateStatus'));
      console.error('Update status error:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId));

  const statusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'SHORTLISTED') {
      return {
        label: t('recruiterApplications.shortlist'),
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-700/40'
      };
    }
    if (s === 'REJECTED') {
      return {
        label: t('recruiterApplications.reject'),
        pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/25 dark:text-rose-200 border border-rose-200/70 dark:border-rose-700/40'
      };
    }
    return {
      label: s || t('common.notAvailable'),
      pill: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
    };
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{t('recruiterApplications.resumePreviewTitle')}</div>
                <div className="text-xs text-white/80">PDF</div>
              </div>
            </div>

            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              {t('recruiterApplications.openResumeTab')}
            </a>
          </div>
        </div>

        <div className="w-full h-[600px] overflow-auto">
          <iframe
            title={t('recruiterApplications.resumePreviewTitle')}
            src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full min-h-[900px] bg-white"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl">
          <div className="px-6 py-8 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
            <h1 className="text-2xl font-bold text-white">{t('recruiterApplications.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('recruiterApplications.subtitle')}</p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="w-full">
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('recruiterApplications.selectJob')}</label>
                  <div className="relative" ref={jobDropdownRef}>
                    <button
                      type="button"
                      disabled={jobsLoading}
                      onClick={() => setIsJobDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 disabled:opacity-60"
                    >
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {jobsLoading
                          ? t('recruiterApplications.loadingJobs')
                          : (selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : t('recruiterApplications.selectJobPlaceholder'))}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isJobDropdownOpen && !jobsLoading && (
                      <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-64 overflow-auto">
                        {jobs.map(job => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => {
                              fetchApplications(job.id);
                              setIsJobDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${String(selectedJobId) === String(job.id) ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                          >
                            <span className="font-medium">{job.title} - {job.company}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl px-4 py-2 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterApplications.applicants')}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{applications.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {appsLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.loadingApps')}</div>
            ) : applications.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('recruiterApplications.applicants')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('recruiterApplications.clickStudentHint')}</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map(app => (
                      (() => {
                        const meta = statusMeta(app.status);
                        const active = selectedApp?.id === app.id;
                        const name = app.student?.name || '';
                        return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${active ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold shadow">
                              {getInitials(name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{app.student?.name || t('common.notAvailable')}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{app.student?.email || t('common.notAvailable')}</div>
                            </div>
                          </div>
                          <div className={`text-[11px] font-bold px-3 py-1 rounded-full ${meta.pill}`}>
                            {meta.label}
                          </div>
                        </div>
                      </button>
                        );
                      })()
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  {!selectedApp ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.selectStudentHint')}</div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          {selectedApp.student?.profilePictureUrl ? (
                            <img
                              src={selectedApp.student.profilePictureUrl}
                              alt={t('recruiterApplications.studentAlt')}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{selectedApp.student?.name || t('common.notAvailable')}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{selectedApp.student?.email || t('common.notAvailable')}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div><span className="font-semibold">{t('recruiterApplications.phone')}:</span> {selectedApp.student?.phone || t('common.notAvailable')}</div>
                        <div><span className="font-semibold">{t('recruiterApplications.college')}:</span> {selectedApp.student?.college || t('common.notAvailable')}</div>
                        <div><span className="font-semibold">{t('recruiterApplications.branch')}:</span> {selectedApp.student?.branch || t('common.notAvailable')}</div>
                        <div><span className="font-semibold">{t('recruiterApplications.year')}:</span> {selectedApp.student?.yearOfPassing || t('common.notAvailable')}</div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                          {t('recruiterApplications.statusUpdated', { status: selectedApp.status || t('common.notAvailable') })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={updatingStatusId === selectedApp.id || selectedApp.status === 'SHORTLISTED'}
                            onClick={() => updateStatus(selectedApp.id, 'SHORTLISTED')}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition border ${selectedApp.status === 'SHORTLISTED'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/15'} disabled:opacity-60`}
                          >
                            {t('recruiterApplications.shortlist')}
                          </button>
                          <button
                            type="button"
                            disabled={updatingStatusId === selectedApp.id || selectedApp.status === 'REJECTED'}
                            onClick={() => updateStatus(selectedApp.id, 'REJECTED')}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition border ${selectedApp.status === 'REJECTED'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-rose-900/15'} disabled:opacity-60`}
                          >
                            {t('recruiterApplications.reject')}
                          </button>
                        </div>
                      </div>

                      <ResumePanel resumeUrl={selectedApp.student?.resumeUrl} />
                    </div>
                  )}
                </div>
              </div>
            ) : selectedJobId ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('recruiterApplications.noAppsYet')}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.noAppsYetHint')}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.selectJobToView')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
