import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { getInitials } from '../../utils/getInitials';
import { ChevronDownIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Dropdown from '../../components/Dropdown';

export default function Applications() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  const pageSize = 5;

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

  const fetchApplications = async (jobId) => {
    if (!jobId) {
      return;
    }
    const toastId = `recruiter-apps-load-${jobId}`;
    setSelectedJobId(jobId);
    setSelectedApp(null);
    setPage(1);
    setAppsLoading(true);
    try {
      const res = await axios.get(`/recruiter/applications/${jobId}`);
      const allApps = Array.isArray(res.data) ? res.data : [];
      const filteredApps = allApps.filter((app) => {
        const status = String(app?.status || '').toUpperCase();
        return status === 'APPLIED' || status === 'REJECTED';
      });
      setApplications(filteredApps);
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
      if (status === 'SHORTLISTED') {
        setApplications(prev => prev.filter(a => a.id !== appId));
        if (selectedApp?.id === appId) setSelectedApp(null);
      } else if (status === 'INTERVIEW_SCHEDULED' || status === 'HIRED') {
        setApplications(prev => prev.filter(a => a.id !== appId));
        if (selectedApp?.id === appId) setSelectedApp(null);
      } else {
        setApplications(prev =>
          prev.map(a => a.id === appId ? { ...a, status } : a)
        );
        setSelectedApp(prev => (prev && prev.id === appId ? { ...prev, status } : prev));
      }
      showToast(toastId, 'info', t('recruiterApplications.statusUpdated', { status }));
    } catch (err) {
      showToast(toastId, 'error', t('recruiterApplications.failedUpdateStatus'));
      console.error('Update status error:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId));

  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize));

  const pagedApplications = applications.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white transition-colors"
              title={t('recruiterStudents.openResume')}
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 pb-2">
              {t('recruiterApplications.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('recruiterApplications.subtitle')}
            </p>
          </div>

          <div className="w-full md:w-[420px]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('recruiterApplications.selectJob')}
            </label>
            <Dropdown open={isJobDropdownOpen} onOpenChange={setIsJobDropdownOpen}>
              {({ open, toggle, close, ref }) => (
                <div className="relative" ref={ref}>
                  <button
                    type="button"
                    disabled={jobsLoading}
                    onClick={toggle}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60 shadow-sm"
                  >
                    <span className="text-sm font-semibold truncate">
                      {jobsLoading
                        ? t('recruiterApplications.loadingJobs')
                        : (selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : t('recruiterApplications.selectJobPlaceholder'))}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {open && !jobsLoading && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-64 overflow-auto">
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            fetchApplications(job.id);
                            close();
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${String(selectedJobId) === String(job.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className="font-medium truncate">{job.title} - {job.company}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Dropdown>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('recruiterStudents.count', { count: applications.length })}
            </div>
          </div>

          <div className="p-6">
            {appsLoading ? (
              <div className="text-gray-600 dark:text-gray-300">{t('recruiterApplications.loadingApps')}</div>
            ) : applications.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">
                {selectedJobId ? t('recruiterApplications.noAppsYet') : t('recruiterApplications.selectJobToView')}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Applicant List */}
                <div className="lg:col-span-3">
                  <div className="space-y-3">
                    {pagedApplications.map((app) => {
                      const isActive = selectedApp?.id === app.id;
                      const meta = statusMeta(app.status);
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
                              <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${meta.pill}`}>
                                {meta.label}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <div className="flex items-center justify-between gap-3 pt-2">
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
                  </div>
                </div>

                {/* Column 2: Details & Status Update */}
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
                            {selectedJob?.title} ({selectedJob?.company})
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('recruiterApplications.email')}</div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium break-all">{selectedApp.student?.email}</div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('recruiterApplications.phone')}</div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">{selectedApp.student?.phone || t('common.notAvailable')}</div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('recruiterApplications.college')}</div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">{selectedApp.student?.college || t('common.notAvailable')}</div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                            <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              {t('recruiterApplications.updateStatus')}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                disabled={updatingStatusId === selectedApp.id || selectedApp.status === 'SHORTLISTED'}
                                onClick={() => updateStatus(selectedApp.id, 'SHORTLISTED')}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedApp.status === 'SHORTLISTED'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'} disabled:opacity-60`}
                              >
                                {t('recruiterApplications.shortlist')}
                              </button>
                              <button
                                type="button"
                                disabled={updatingStatusId === selectedApp.id || selectedApp.status === 'REJECTED'}
                                onClick={() => updateStatus(selectedApp.id, 'REJECTED')}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedApp.status === 'REJECTED'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400'} disabled:opacity-60`}
                              >
                                {t('recruiterApplications.reject')}
                              </button>
                            </div>
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
