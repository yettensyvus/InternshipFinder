import { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../services/axios';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../services/toast';
import { getInitials } from '../../utils/getInitials';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function RecruiterStudents() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const jobDropdownRef = useRef(null);

  const pageSize = 5;

  useEffect(() => {
    const load = async () => {
      const toastId = 'recruiter-students-load';
      setLoading(true);
      try {
        const res = await axios.get('/recruiter/students');
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast(toastId, 'error', t('recruiterStudents.failedLoad'));
        console.error('Recruiter students fetch error:', err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadJobs = async () => {
      const toastId = 'recruiter-students-jobs-load';
      setJobsLoading(true);
      try {
        const res = await axios.get('/recruiter/my-jobs');
        setJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        showToast(toastId, 'error', t('recruiterStudents.failedLoadJobs'));
        console.error('Recruiter jobs fetch error:', err);
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
        setIsJobDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsJobDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return students;
    return (students || []).filter((s) => {
      const hay = [
        s?.name,
        s?.email,
        s?.phone,
        s?.college,
        s?.branch,
        s?.yearOfPassing
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [students, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = useMemo(() => {
    const total = Array.isArray(filtered) ? filtered.length : 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [filtered]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedStudents = useMemo(() => {
    const list = Array.isArray(filtered) ? filtered : [];
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filtered, page]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return (students || []).find((s) => String(s?.id) === String(selectedStudentId)) || null;
  }, [students, selectedStudentId]);

  useEffect(() => {
    setSelectedJobId('');
    setIsJobDropdownOpen(false);
  }, [selectedStudentId]);

  const activeJob = useMemo(() => {
    if (!selectedJobId) return null;
    return (jobs || []).find((j) => String(j?.id) === String(selectedJobId)) || null;
  }, [jobs, selectedJobId]);

  const availableJobs = useMemo(() => {
    if (!selectedStudent) return jobs;
    const appliedIds = selectedStudent.appliedJobIds || [];
    return (jobs || []).filter(j => !appliedIds.includes(j.id));
  }, [jobs, selectedStudent]);

  const recommendJob = async () => {
    const toastId = 'recruiter-recommend-job';
    if (!selectedStudent?.id || !selectedJobId) return;
    if (recommending) return;

    setRecommending(true);
    try {
      await axios.post('/recruiter/recommend-job', {
        studentId: Number(selectedStudent.id),
        jobId: Number(selectedJobId)
      });
      showToast(toastId, 'success', t('recruiterStudents.recommendationSent'));
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('recruiterStudents.failedRecommend'));
      console.error('Recommend job error:', err);
    } finally {
      setRecommending(false);
    }
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-white truncate">{t('recruiterApplications.resume')}</div>
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
        <div className="flex-1 min-h-[500px] bg-gray-100 dark:bg-gray-800">
          <iframe
            title="CV Preview"
            src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none"
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 pb-2">
              {t('recruiterStudents.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('recruiterStudents.subtitle')}
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
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              <div className="text-gray-600 dark:text-gray-300">{t('recruiterStudents.empty')}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Student List */}
                <div className="lg:col-span-3">
                  <div className="space-y-3">
                    {pagedStudents.map((s) => {
                      const isActive = String(s?.id) === String(selectedStudentId);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStudentId(s.id)}
                          className={`w-full text-left bg-white dark:bg-gray-900/40 border rounded-2xl p-4 shadow-sm transition-colors ${isActive ? 'border-violet-300 dark:border-violet-700 ring-2 ring-violet-200/70 dark:ring-violet-900/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/60'}`}
                        >
                          <div className="flex items-center gap-3">
                            {s.profilePictureUrl ? (
                              <img
                                src={s.profilePictureUrl}
                                alt={s.name || t('common.user')}
                                className="w-10 h-10 rounded-full object-cover border border-violet-200 dark:border-violet-700 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {getInitials(s.name)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {s.name || t('common.notAvailable')}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {s.college || t('common.notAvailable')}
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

                {/* Column 2: Details & Recommendation */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full">
                    {!selectedStudent ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 font-medium">
                          {t('recruiterStudents.selectStudent')}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {selectedStudent.name || t('common.notAvailable')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {selectedStudent.college || t('common.notAvailable')}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {t('recruiterStudents.email')}
                            </div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium break-all">
                              {selectedStudent.email || t('common.notAvailable')}
                            </div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {t('recruiterStudents.phone')}
                            </div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">
                              {selectedStudent.phone || t('common.notAvailable')}
                            </div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {t('recruiterStudents.branch')}
                            </div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">
                              {selectedStudent.branch || t('common.notAvailable')}
                            </div>
                          </div>
                          <div className="text-sm p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {t('recruiterStudents.yearOfPassing')}
                            </div>
                            <div className="text-gray-800 dark:text-gray-100 font-medium">
                              {selectedStudent.yearOfPassing || t('common.notAvailable')}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            {t('recruiterStudents.recommendJob')}
                          </div>

                          <div className="space-y-3">
                            <div className="relative w-full" ref={jobDropdownRef}>
                              <button
                                type="button"
                                disabled={jobsLoading || jobs.length === 0}
                                onClick={() => setIsJobDropdownOpen((v) => !v)}
                                className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60"
                              >
                                <span className="text-sm font-semibold truncate">
                                  {activeJob?.title || (jobsLoading ? t('common.pleaseWait') : t('recruiterStudents.selectJob'))}
                                </span>
                                <ChevronDownIcon
                                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`}
                                />
                              </button>

                              {isJobDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-48 overflow-auto">
                                  {availableJobs.map((j) => (
                                    <button
                                      key={j.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedJobId(String(j.id));
                                        setIsJobDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${
                                        String(selectedJobId) === String(j.id)
                                          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                    >
                                      <span className="font-medium truncate">{j.title}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{j.id}</span>
                                    </button>
                                  ))}
                                  {availableJobs.length === 0 && (
                                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic text-center">
                                      {t('recruiterStudents.noAvailableJobs')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={recommendJob}
                              disabled={recommending || !selectedJobId}
                              className="w-full px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 transition shadow-sm text-sm font-semibold"
                            >
                              {recommending ? t('recruiterStudents.recommending') : t('recruiterStudents.recommend')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: CV Viewer */}
                <div className="lg:col-span-5 h-full min-h-[600px]">
                   <ResumePanel resumeUrl={selectedStudent?.resumeUrl} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
