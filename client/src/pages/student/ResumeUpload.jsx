import { useEffect, useRef, useState } from 'react';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export default function ResumeUpload() {
  const [uploading, setUploading] = useState(false);
  const { t } = useTranslation();
  const [resumeUrl, setResumeUrl] = useState(null);
  const fileInputRef = useRef(null);
  const toastId = 'student-resume-upload';

  const schema = yup.object({
    file: yup
      .mixed()
      .required()
  });

  const {
    setValue,
    handleSubmit,
    watch
  } = useForm({
    defaultValues: { file: null },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const file = watch('file');

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

  const onSubmit = async (data) => {
    const selectedFile = data?.file;
    if (!file) {
      showToast(toastId, 'error', t('resumeUpload.chooseFile'));
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      showToast(toastId, 'error', t('resumeUpload.fileTooLarge'));
      return;
    }

    const name = (selectedFile.name || '').toLowerCase();
    if (!name.endsWith('.pdf')) {
      showToast(toastId, 'error', t('resumeUpload.mustBePdf'));
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await axios.post('/student/resume', formData);
      if (typeof res.data === 'string' && res.data.startsWith('http')) {
        setResumeUrl(res.data);
      }
      showToast(toastId, 'success', t('resumeUpload.uploaded'));
      setValue('file', null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      showToast(toastId, 'error', t('resumeUpload.uploadFailed'));
      console.error('Resume upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-36 md:pb-20">
      <div className="w-full px-2 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 pb-2">
              {t('resumeUpload.title')}
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
              {t('resumeUpload.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('resumeUpload.fileTitle')}
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative group/dropzone cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-10 text-center
                      ${file 
                        ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => setValue('file', e.target.files?.[0] || null, { shouldDirty: true })}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <div className={`mb-4 p-4 rounded-2xl transition-colors duration-300 ${file ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover/dropzone:bg-indigo-50 dark:group-hover/dropzone:bg-indigo-900/20 group-hover/dropzone:text-indigo-500'}`}>
                        <ArrowTopRightOnSquareIcon className="h-8 w-8 transform rotate-45" />
                      </div>
                      <div className="text-base font-bold text-gray-900 dark:text-white">
                        {file ? t('resumeUpload.selected') : t('resumeUpload.chooseFileButton')}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[240px] mx-auto truncate font-medium">
                        {file?.name || t('resumeUpload.noFileChosen')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-4 text-center shadow-sm">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">{t('resumeUpload.meta.formatLabel')}</div>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('resumeUpload.meta.formatValue')}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-4 text-center shadow-sm">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">{t('resumeUpload.meta.maxSizeLabel')}</div>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('resumeUpload.meta.maxSizeValue')}</div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="hidden md:block w-full h-14 rounded-2xl bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('resumeUpload.uploading')}</span>
                      </div>
                    ) : t('resumeUpload.upload')}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 font-medium italic">
                    {t('resumeUpload.upToDateHint')}
                  </p>
                </form>

                {resumeUrl && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-500/5 p-5 border-l-4 border-l-emerald-500 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <DocumentTextIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">{t('recruiterApplications.resume')}</div>
                        <div className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white truncate">
                          {t('resumeUpload.resumeLive')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden shadow-sm h-full flex flex-col min-h-[600px]">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide uppercase">{t('studentProfile.viewResume')}</span>
                    </div>
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white transition-colors"
                        title={t('recruiterStudents.openResume')}
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900/40 overflow-hidden">
                    {resumeUrl ? (
                      <iframe
                        title={t('studentProfile.viewResume')}
                        src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full min-h-[700px] border-none"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <div className="h-20 w-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <DocumentTextIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('studentProfile.noResumeHint')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3">
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={uploading || !file}
          className="w-full h-14 rounded-2xl bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('resumeUpload.uploading')}</span>
            </div>
          ) : t('resumeUpload.upload')}
        </button>
      </div>
    </div>
  );
}
