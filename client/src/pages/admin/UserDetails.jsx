import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/axios';
import { showToast } from '../../services/toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    role: 'STUDENT',
    enabled: true,
    student: null,
    recruiter: null
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/admin/users/${id}`);
        setUser(res.data);
        setForm({
          username: res.data?.username || '',
          email: res.data?.email || '',
          role: res.data?.role || 'STUDENT',
          enabled: !!res.data?.enabled,
          student: res.data?.student || null,
          recruiter: res.data?.recruiter || null
        });
      } catch (err) {
        showToast('admin-user-load', 'error', t('adminUserDetails.failedLoadUser'));
        console.error('Admin user details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setStudentField = (name, value) => {
    setForm(prev => ({
      ...prev,
      student: { ...(prev.student || {}), [name]: value }
    }));
  };

  const setRecruiterField = (name, value) => {
    setForm(prev => ({
      ...prev,
      recruiter: { ...(prev.recruiter || {}), [name]: value }
    }));
  };

  const save = async () => {
    if (!id) return;
    const toastId = `admin-user-update-${id}`;
    const username = (form.username || '').trim();
    const email = (form.email || '').trim();

    if (!username) return showToast(toastId, 'error', t('adminUserDetails.usernameRequired'));
    if (!email) return showToast(toastId, 'error', t('adminUserDetails.emailRequired'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast(toastId, 'error', t('auth.invalidEmail'));
    if (isSelf && user?.role && form.role !== user.role) return showToast(toastId, 'error', t('common.accessDenied'));

    setSaving(true);
    try {
      const res = await axios.put(`/admin/users/${id}`, {
        username,
        email,
        role: isSelf ? user?.role : form.role,
        enabled: form.enabled,
        student: form.student,
        recruiter: form.recruiter
      });
      setUser(res.data);
      setForm({
        username: res.data?.username || '',
        email: res.data?.email || '',
        role: res.data?.role || 'STUDENT',
        enabled: !!res.data?.enabled,
        student: res.data?.student || null,
        recruiter: res.data?.recruiter || null
      });
      showToast(toastId, 'info', t('adminUserDetails.userUpdated'));
    } catch (err) {
      showToast(toastId, 'error', t('adminUserDetails.failedUpdateUser'));
      console.error('Admin update user error:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async () => {
    if (!id) return;
    const toastId = `admin-user-status-${id}`;
    try {
      await axios.put(`/admin/users/${id}/status?enabled=${!form.enabled}`);
      setForm(prev => ({ ...prev, enabled: !prev.enabled }));
      showToast(toastId, 'info', !form.enabled ? t('adminUserDetails.userUnblocked') : t('adminUserDetails.userBlocked'));
    } catch (err) {
      showToast(toastId, 'error', t('adminUserDetails.failedUpdateStatus'));
      console.error('Admin status error:', err);
    }
  };

  const deleteUser = async () => {
    if (!id) return;
    const toastId = `admin-user-delete-${id}`;
    const myEmail = (auth?.email || '').trim().toLowerCase();
    const viewedEmail = (user?.email || '').trim().toLowerCase();
    if (myEmail && viewedEmail && myEmail === viewedEmail) {
      showToast(toastId, 'error', t('common.accessDenied'));
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`/admin/users/${id}`);
      showToast(toastId, 'success', t('adminUserDetails.userDeleted'));
      navigate('/admin/users');
    } catch (err) {
      showToast(toastId, 'error', t('adminUserDetails.failedDeleteUser'));
      console.error('Admin delete error:', err);
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const role = form.role || user?.role;
  const myEmail = (auth?.email || '').trim().toLowerCase();
  const isSelf = myEmail && (user?.email || '').trim().toLowerCase() === myEmail;

  const roleOptions = [
    { value: 'STUDENT', label: t('common.roles.student') },
    { value: 'RECRUITER', label: t('common.roles.recruiter') },
    { value: 'ADMIN', label: t('common.roles.admin') }
  ];
  const activeRole = roleOptions.find(r => r.value === form.role) || roleOptions[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{t('adminUserDetails.title')}</h1>
                <p className="text-white/80 text-sm mt-1">{t('adminUserDetails.subtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
                >
                  {t('common.goBack')}
                </button>
                {isSelf ? null : (
                  <>
                    <button
                      type="button"
                      onClick={toggleBlocked}
                      className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition ${form.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {form.enabled ? t('adminDashboard.block') : t('adminUserDetails.unblock')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold"
                    >
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.pleaseWait')}</div>
            ) : !user ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.userNotFound')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.account')}</div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.username')}</label>
                      <input
                        value={form.username}
                        onChange={(e) => setField('username', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.email')}</label>
                      <input
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2 relative" ref={roleDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminDashboard.role')}</label>
                      {isSelf ? (
                        <div className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activeRole.label}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{activeRole.label}</span>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isRoleDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                              {roleOptions.map((r) => (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => {
                                    setForm(prev => ({
                                      ...prev,
                                      role: r.value,
                                      student: r.value === 'STUDENT' ? (prev.student || {}) : null,
                                      recruiter: r.value === 'RECRUITER' ? (prev.recruiter || {}) : null
                                    }));
                                    setIsRoleDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${form.role === r.value ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                  <span className="font-medium">{r.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {form.role === 'STUDENT' ? (
                    <div className="mt-8">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.studentProfile')}</div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.name')}</label>
                          <input
                            value={form.student?.name || ''}
                            onChange={(e) => setStudentField('name', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.phone')}</label>
                          <input
                            value={form.student?.phone || ''}
                            onChange={(e) => setStudentField('phone', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.college')}</label>
                          <input
                            value={form.student?.college || ''}
                            onChange={(e) => setStudentField('college', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.branch')}</label>
                          <input
                            value={form.student?.branch || ''}
                            onChange={(e) => setStudentField('branch', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.yearOfPassing')}</label>
                          <input
                            value={form.student?.yearOfPassing || ''}
                            onChange={(e) => setStudentField('yearOfPassing', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.resumeUrl')}</label>
                          <input
                            value={form.student?.resumeUrl || ''}
                            onChange={(e) => setStudentField('resumeUrl', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {role === 'RECRUITER' ? (
                    <div className="mt-8">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.recruiterProfile')}</div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.companyName')}</label>
                          <input
                            value={form.recruiter?.companyName || ''}
                            onChange={(e) => setRecruiterField('companyName', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.companyWebsite')}</label>
                          <input
                            value={form.recruiter?.companyWebsite || ''}
                            onChange={(e) => setRecruiterField('companyWebsite', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('adminUserDetails.profilePictureUrl')}</label>
                          <input
                            value={form.recruiter?.profilePictureUrl || ''}
                            onChange={(e) => setRecruiterField('profilePictureUrl', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      {saving ? t('adminUserDetails.saving') : t('adminUserDetails.saveChanges')}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.status')}</div>
                  <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <div><span className="font-semibold">{t('adminUserDetails.roleLabel')}</span> {user.role}</div>
                    <div>
                      <span className="font-semibold">{t('adminUserDetails.enabledLabel')}</span>{' '}
                      {form.enabled ? t('adminUserDetails.yes') : t('adminUserDetails.noBlocked')}
                    </div>
                  </div>

                  {role === 'STUDENT' && form.student?.profilePictureUrl ? (
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.profilePhoto')}</div>
                      <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={form.student.profilePictureUrl} alt={t('adminUserDetails.studentAlt')} className="w-full h-56 object-cover" />
                      </div>
                    </div>
                  ) : null}

                  {role === 'STUDENT' && form.student?.resumeUrl ? (
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('adminUserDetails.resume')}</div>
                      <a
                        href={form.student.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-indigo-700 dark:text-indigo-300"
                      >
                        {t('adminUserDetails.openResume')}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDeleteModalOpen && user ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
              <div className="text-lg font-bold text-white">{t('common.delete')}</div>
              <div className="text-sm text-white/80 mt-1">{t('adminUserDetails.deleteConfirm')}</div>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={deleteUser}
                  disabled={deleting}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-semibold hover:from-red-700 hover:via-rose-700 hover:to-pink-700 disabled:opacity-60"
                >
                  {deleting ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
