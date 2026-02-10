import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { t } = useTranslation();
  const [resumeUrl, setResumeUrl] = useState(null);
  const fileInputRef = useRef(null);
  const toastId = 'student-resume-upload';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/student/profile');
        const url = res?.data?.resumeUrl;
        if (typeof url === 'string' && url.startsWith('http')) {
          setResumeUrl(url);
        }
      } catch {
        return;
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      showToast(toastId, 'error', t('resumeUpload.chooseFile'));
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(toastId, 'error', t('resumeUpload.fileTooLarge'));
      return;
    }

    const name = (file.name || '').toLowerCase();
    if (!name.endsWith('.pdf')) {
      showToast(toastId, 'error', t('resumeUpload.mustBePdf'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('/student/resume', formData);
      if (typeof res.data === 'string' && res.data.startsWith('http')) {
        setResumeUrl(res.data);
      }
      showToast(toastId, 'success', t('resumeUpload.uploaded'));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      showToast(toastId, 'error', t('resumeUpload.uploadFailed'));
      console.error('Resume upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
            <h1 className="text-2xl font-bold text-white">{t('resumeUpload.title')}</h1>
            <p className="text-white/80 text-sm mt-1">{t('resumeUpload.subtitle')}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {t('resumeUpload.fileTitle')}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('resumeUpload.fileHint')}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />

                    <div 
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`relative group/dropzone cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center
                        ${file 
                          ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5' 
                          : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/50'
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`mb-3 p-3 rounded-full transition-colors duration-300 ${file ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover/dropzone:bg-indigo-50 dark:group-hover/dropzone:bg-indigo-900/20 group-hover/dropzone:text-indigo-500'}`}>
                          <ArrowTopRightOnSquareIcon className="h-6 w-6 transform rotate-45" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {file ? t('resumeUpload.selected') : t('resumeUpload.chooseFileButton')}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto truncate">
                          {file?.name || t('resumeUpload.noFileChosen')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">{t('resumeUpload.meta.formatLabel')}</div>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('resumeUpload.meta.formatValue')}</div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">{t('resumeUpload.meta.maxSizeLabel')}</div>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('resumeUpload.meta.maxSizeValue')}</div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={uploading || !file}
                        className="w-full relative group h-12 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          {uploading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('resumeUpload.uploading')}</span>
                            </>
                          ) : (
                            <span>{t('resumeUpload.upload')}</span>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-[10px] text-center text-gray-400 mt-3 px-4 italic">
                        {t('resumeUpload.upToDateHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 p-5 shadow-sm border-l-4 border-l-indigo-500">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${resumeUrl ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">{t('recruiterApplications.resume')}</div>
                      <div className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white truncate">
                        {resumeUrl ? t('common.readyToUpload') : t('studentProfile.noResume')}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        {resumeUrl ? t('resumeUpload.upToDateHint') : t('studentProfile.noResumeHint')}
                      </p>
                    </div>
                  </div>
                </div>
              </form>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t('resumeUpload.title')}</div>
                        <div className="text-xs text-white/80">{t('resumeUpload.meta.formatValue')}</div>
                      </div>
                    </div>

                    {resumeUrl ? (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        {t('studentProfile.viewResume')}
                      </a>
                    ) : null}
                  </div>
                </div>

                {resumeUrl ? (
                  <div className="w-full h-[600px] overflow-auto">
                    <iframe
                      title={t('studentProfile.viewResume')}
                      src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full min-h-[1100px] bg-white"
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('studentProfile.noResumeHint')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
