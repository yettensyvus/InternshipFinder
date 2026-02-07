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
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('resumeUpload.fileTitle')}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('resumeUpload.fileHint')}</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {t('resumeUpload.chooseFileButton')}
                    </button>
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {file?.name ? file.name : t('resumeUpload.noFileChosen')}
                    </div>
                  </div>

                  {file ? (
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {t('resumeUpload.selected')}: <span className="font-semibold">{file.name}</span>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('resumeUpload.noFileSelected')}</div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('recruiterApplications.resume')}</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {resumeUrl ? t('common.readyToUpload') : t('studentProfile.noResume')}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {resumeUrl ? t('resumeUpload.upToDateHint') : t('studentProfile.noResumeHint')}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('resumeUpload.upToDateHint')}</div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                  >
                    {uploading ? t('resumeUpload.uploading') : t('resumeUpload.upload')}
                  </button>
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
                        <div className="text-xs text-white/80">PDF</div>
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
