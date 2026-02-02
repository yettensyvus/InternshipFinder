import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Applications() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
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
    try {
      const allowed = ['SHORTLISTED', 'REJECTED'];
      if (!allowed.includes(status)) {
        showToast(toastId, 'error', t('recruiterApplications.invalidStatus'));
        return;
      }
      await axios.put(`/recruiter/applications/${appId}?status=${status}`);
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status } : a)
      );
      setSelectedApp(prev => (prev && prev.id === appId ? { ...prev, status } : prev));
      showToast(toastId, 'info', t('recruiterApplications.statusUpdated', { status }));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterApplications.failedUpdateStatus'));
      console.error('Update status error:', err);
    }
  };

  const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId));

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

            {appsLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('recruiterApplications.loadingApps')}</div>
            ) : applications.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('recruiterApplications.applicants')}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('recruiterApplications.clickStudentHint')}</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${selectedApp?.id === app.id ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{app.student?.name || t('common.notAvailable')}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{app.student?.email || t('common.notAvailable')}</div>
                          </div>
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {app.status || t('common.notAvailable')}
                          </div>
                        </div>
                      </button>
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

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(selectedApp.id, 'SHORTLISTED')}
                          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                        >
                          {t('recruiterApplications.shortlist')}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(selectedApp.id, 'REJECTED')}
                          className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
                        >
                          {t('recruiterApplications.reject')}
                        </button>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('recruiterApplications.resume')}</div>
                        {selectedApp.student?.resumeUrl ? (
                          <div className="mt-2 space-y-2">
                            <a
                              href={selectedApp.student.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-indigo-700 dark:text-indigo-300"
                            >
                              {t('recruiterApplications.openResumeTab')}
                            </a>
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                              <iframe
                                title={t('recruiterApplications.resumePreviewTitle')}
                                src={selectedApp.student.resumeUrl}
                                className="w-full h-[360px]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('recruiterApplications.noResume')}</div>
                        )}
                      </div>
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
