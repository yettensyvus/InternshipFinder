import { useEffect, useState, useRef } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../services/toast';
import { useAuth } from '../../hooks/useAuth';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  DocumentTextIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function ManageUsers() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [forcingLogoutId, setForcingLogoutId] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const picInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    role: 'STUDENT',
    enabled: true,
    student: {
      name: '',
      phone: '',
      college: '',
      branch: '',
      yearOfPassing: '',
      resumeUrl: ''
    },
    recruiter: {
      companyName: '',
      companyWebsite: ''
    }
  });

  const [page, setPage] = useState(1);
  const pageSize = 9;

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/admin/users');

      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        throw new Error('Invalid user response format');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(t('adminDashboard.failedToLoadUsers'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const res = await axios.get(`/admin/users/${userId}`);
      const data = res.data;
      setUserDetails(data);
      setForm({
        username: data.username || '',
        email: data.email || '',
        role: data.role || 'STUDENT',
        enabled: data.enabled ?? true,
        student: {
          name: data.student?.name || '',
          phone: data.student?.phone || '',
          college: data.student?.college || '',
          branch: data.student?.branch || '',
          yearOfPassing: data.student?.yearOfPassing || '',
          resumeUrl: data.student?.resumeUrl || ''
        },
        recruiter: {
          companyName: data.recruiter?.companyName || '',
          companyWebsite: data.recruiter?.companyWebsite || ''
        }
      });
    } catch (err) {
      console.error('Failed to load user details:', err);
      showToast('admin-user-details', 'error', t('adminUserDetails.failedLoadUser'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleUserStatus = async (id, enabled) => {
    const toastId = `admin-user-status-${id || 'unknown'}`;
    try {
      setUpdatingId(id);
      await axios.put(`/admin/users/${id}/status?enabled=${!enabled}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: !enabled } : u));
      if (selectedUser?.id === id) {
        setSelectedUser(prev => (prev ? ({ ...prev, enabled: !enabled }) : prev));
      }
      showToast(toastId, 'info', t(!enabled ? 'adminDashboard.approve' : 'adminDashboard.block'));
    } catch (err) {
      console.error('Failed to update user status:', err);
      showToast(toastId, 'error', t('adminDashboard.failedUpdateStatus'));
    } finally {
      setUpdatingId(null);
    }
  };

  const forceLogout = async (id) => {
    const toastId = `admin-user-force-logout-${id || 'unknown'}`;
    try {
      setForcingLogoutId(id);
      await axios.post(`/admin/users/${id}/force-logout`);
      showToast(toastId, 'success', t('adminDashboard.forceLogoutSuccess'));
    } catch (err) {
      console.error('Failed to force logout user:', err);
      showToast(toastId, 'error', t('adminDashboard.failedForceLogout'));
    } finally {
      setForcingLogoutId(null);
    }
  };

  const deleteUser = async (id) => {
    const toastId = `admin-user-delete-${id || 'unknown'}`;
    try {
      setDeletingId(id);
      await axios.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
      if (selectedUser?.id === id) {
        setSelectedUser(null);
        setUserDetails(null);
      }
      showToast(toastId, 'success', t('adminDashboard.userDeleted'));
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast(toastId, 'error', t('adminDashboard.failedDeleteUser'));
    } finally {
      setDeletingId(null);
      setDeleteModalUser(null);
    }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('admin-pic-upload', 'error', t('common.fileTooLarge', { size: '2MB' }));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setPicUploading(true);
    try {
      const res = await axios.post(`/admin/users/${selectedUser.id}/profile-picture`, formData);
      const newUrl = res.data;
      setUserDetails(prev => ({ ...prev, profilePictureUrl: newUrl }));
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, profilePictureUrl: newUrl } : u));
      setSelectedUser(prev => ({ ...prev, profilePictureUrl: newUrl }));
      showToast('admin-pic-upload', 'success', t('common.photoUploaded'));
    } catch (err) {
      showToast('admin-pic-upload', 'error', t('common.uploadFailed'));
    } finally {
      setPicUploading(false);
      if (picInputRef.current) picInputRef.current.value = '';
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('admin-resume-upload', 'error', t('common.fileTooLarge', { size: '10MB' }));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setResumeUploading(true);
    try {
      const res = await axios.post(`/admin/users/${selectedUser.id}/resume`, formData);
      const newUrl = res.data;
      setUserDetails(prev => ({
        ...prev,
        student: prev.student ? { ...prev.student, resumeUrl: newUrl } : prev.student
      }));
      showToast('admin-resume-upload', 'success', t('common.uploadSuccess'));
    } catch (err) {
      showToast('admin-resume-upload', 'error', t('common.uploadFailed'));
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const saveDetails = async () => {
    if (!selectedUser) return;
    const toastId = `admin-user-save-${selectedUser.id}`;
    setSaving(true);
    try {
      const res = await axios.put(`/admin/users/${selectedUser.id}`, form);
      setUserDetails(res.data);
      // Update the user in the main list too
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, username: form.username, email: form.email, role: form.role, enabled: form.enabled } : u));
      showToast(toastId, 'success', t('adminUserDetails.saveSuccess'));
    } catch (err) {
      console.error('Failed to save user details:', err);
      showToast(toastId, 'error', t('adminUserDetails.failedUpdateUser'));
    } finally {
      setSaving(false);
    }
  };

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setStudentField = (name, value) => {
    setForm(prev => ({
      ...prev,
      student: { ...prev.student, [name]: value }
    }));
  };

  const setRecruiterField = (name, value) => {
    setForm(prev => ({
      ...prev,
      recruiter: { ...prev.recruiter, [name]: value }
    }));
  };

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter(u => {
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return username.includes(normalizedQuery) || email.includes(normalizedQuery) || role.includes(normalizedQuery);
    })
    : users;

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const myEmail = (auth?.email || '').trim().toLowerCase();
  const isSelf = (u) => {
    const email = (u?.email || '').trim().toLowerCase();
    return !!myEmail && !!email && email === myEmail;
  };

  const getInitials = (value) => {
    const v = String(value || '').trim();
    if (!v) return '?';
    const parts = v.split(' ').filter(Boolean);
    return (parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pt-12 pb-20">
      <div className="w-full px-2 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-400 dark:via-rose-400 dark:to-pink-400 pb-2">
                {t('adminDashboard.manageUsers')}
              </h1>
              <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl text-lg mx-auto md:mx-0">
                {t('adminDashboard.clickRowHint')}
              </p>
            </div>

            <div className="w-full md:w-[420px]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 text-center md:text-left">
                {t('recruiterStudents.search')}
              </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${t('adminDashboard.username')} / ${t('adminDashboard.email')} / ${t('adminDashboard.role')}`}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">
              {t('adminDashboard.manageUsers')} ({filteredUsers.length})
            </div>
            <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200 mb-6">
                {error}
              </div>
            ) : null}

            {loading && users.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-300 p-10 text-center">{t('adminDashboard.loadingUsers')}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: User List */}
                <div className="lg:col-span-3 lg:border-r lg:border-gray-100 lg:dark:border-gray-800 lg:pr-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 mb-2 px-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
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

                    {pagedUsers.length === 0 ? (
                      <div className="text-sm text-gray-500 py-10 text-center">{t('adminDashboard.noUsersFound')}</div>
                    ) : (
                      pagedUsers.map((u) => {
                        const isActive = selectedUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              fetchUserDetails(u.id);
                            }}
                            className={`w-full text-left bg-white dark:bg-gray-900/40 border rounded-2xl p-4 shadow-sm transition-all ${isActive ? 'border-red-300 dark:border-red-700 ring-2 ring-red-200/70 dark:ring-red-900/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/60'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 font-bold flex-shrink-0 overflow-hidden">
                                {u.profilePictureUrl ? (
                                  <img src={u.profilePictureUrl} className="h-full w-full object-cover" alt="" />
                                ) : getInitials(u.username)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {u.username}
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                                  {u.role}
                                </div>
                              </div>
                              {!u.enabled && <NoSymbolIcon className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Column 2: Profile + Resume (large screens) */}
                <div className="lg:col-span-5">
                  {!selectedUser ? (
                    <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">{t('adminDashboard.clickRowHint')}</p>
                    </div>
                  ) : detailsLoading ? (
                    <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm">{t('common.pleaseWait')}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('adminUserDetails.profilePhoto')}</h3>
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => picInputRef.current?.click()}
                            disabled={picUploading}
                            className="group relative h-48 w-48 rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                          >
                            {selectedUser.profilePictureUrl ? (
                              <img src={selectedUser.profilePictureUrl} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                            ) : (
                              <span className="text-5xl font-bold text-gray-300 dark:text-gray-600">{getInitials(selectedUser.username)}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
                              <ArrowPathIcon className={`h-8 w-8 mb-2 ${picUploading ? 'animate-spin' : ''}`} />
                              <span className="text-[10px] font-bold uppercase tracking-tighter leading-tight">
                                {picUploading ? t('common.pleaseWait') : t('common.uploadPhoto')}
                              </span>
                            </div>
                          </button>
                          <input ref={picInputRef} type="file" accept="image/*" onChange={handlePicUpload} className="hidden" />
                          <p className="mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-widest text-center italic">{t('adminUserDetails.photoFormatHint')}</p>
                        </div>
                      </div>

                      <div className="hidden lg:block">
                        {selectedUser.role === 'STUDENT' ? (
                          <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('adminUserDetails.resume')}</h3>
                            <div className="space-y-4">
                              {userDetails?.student?.resumeUrl ? (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                      <DocumentTextIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{t('adminUserDetails.resumeFileName')}</div>
                                      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{t('adminUserDetails.resumeReady')}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => window.open(userDetails.student.resumeUrl, '_blank')}
                                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all shadow-sm"
                                  >
                                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="p-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                                  <DocumentTextIcon className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500 font-medium">{t('adminUserDetails.noResume')}</p>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => resumeInputRef.current?.click()}
                                disabled={resumeUploading}
                                className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                              >
                                <ArrowPathIcon className={`h-4 w-4 ${resumeUploading ? 'animate-spin' : ''}`} />
                                {resumeUploading ? t('common.pleaseWait') : t('adminUserDetails.uploadNewResume')}
                              </button>
                              <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Resume (Student Only) */}
                <div className="lg:hidden">
                  {!selectedUser ? (
                    <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <DocumentTextIcon className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">{t('adminDashboard.clickRowHint')}</p>
                    </div>
                  ) : detailsLoading ? (
                    <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm">{t('common.pleaseWait')}</p>
                    </div>
                  ) : selectedUser.role === 'STUDENT' ? (
                    <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('adminUserDetails.resume')}</h3>
                      <div className="space-y-4">
                        {userDetails?.student?.resumeUrl ? (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <DocumentTextIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{t('adminUserDetails.resumeFileName')}</div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{t('adminUserDetails.resumeReady')}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(userDetails.student.resumeUrl, '_blank')}
                              className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all shadow-sm"
                            >
                              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <DocumentTextIcon className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-medium">{t('adminUserDetails.noResume')}</p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={resumeUploading}
                          className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${resumeUploading ? 'animate-spin' : ''}`} />
                          {resumeUploading ? t('common.pleaseWait') : t('adminUserDetails.uploadNewResume')}
                        </button>
                        <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                      <DocumentTextIcon className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">{t('adminUserDetails.noResume')}</p>
                    </div>
                  )}
                </div>

                {/* Column 4: Profile Data + Actions (buttons last) */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full flex flex-col">
                    {!selectedUser ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10 text-gray-600 dark:text-gray-400">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <UserIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        {t('adminDashboard.clickRowHint')}
                      </div>
                    ) : detailsLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10 text-gray-600 dark:text-gray-400">
                        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="mt-3 text-sm font-semibold">{t('common.pleaseWait')}</div>
                      </div>
                    ) : (
                      <div className="space-y-6 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">
                              {selectedUser.username}
                            </div>
                            <div className="text-sm text-gray-500 font-medium mt-1 truncate">
                              {selectedUser.email}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.username')}</label>
                            <input
                              value={form.username}
                              onChange={(e) => setField('username', e.target.value)}
                              className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.email')}</label>
                            <input
                              value={form.email}
                              onChange={(e) => setField('email', e.target.value)}
                              className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.roleLabel')}</label>
                            <div className="relative" ref={roleDropdownRef}>
                              <button
                                type="button"
                                onClick={() => !isSelf(selectedUser) && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                disabled={isSelf(selectedUser)}
                                className="w-full flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all disabled:opacity-50"
                              >
                                <span className="font-semibold">{form.role}</span>
                                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isRoleDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                                  {['STUDENT', 'RECRUITER', 'ADMIN'].map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => {
                                        setField('role', r);
                                        setIsRoleDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-200 ${form.role === r ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                      <span className="font-bold">{r}</span>
                                      {form.role === r && <CheckCircleIcon className="h-4 w-4 text-red-500" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Role Specific Fields */}
                          {form.role === 'STUDENT' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.name')}</label>
                                <input
                                  value={form.student.name}
                                  onChange={(e) => setStudentField('name', e.target.value)}
                                  className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.phone')}</label>
                                  <input
                                    value={form.student.phone}
                                    onChange={(e) => setStudentField('phone', e.target.value)}
                                    className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.yearOfPassing')}</label>
                                  <input
                                    value={form.student.yearOfPassing}
                                    onChange={(e) => setStudentField('yearOfPassing', e.target.value)}
                                    className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.college')}</label>
                                  <input
                                    value={form.student.college}
                                    onChange={(e) => setStudentField('college', e.target.value)}
                                    className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.branch')}</label>
                                  <input
                                    value={form.student.branch}
                                    onChange={(e) => setStudentField('branch', e.target.value)}
                                    className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {form.role === 'RECRUITER' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.companyName')}</label>
                                <input
                                  value={form.recruiter.companyName}
                                  onChange={(e) => setRecruiterField('companyName', e.target.value)}
                                  className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('adminUserDetails.companyWebsite')}</label>
                                <input
                                  value={form.recruiter.companyWebsite}
                                  onChange={(e) => setRecruiterField('companyWebsite', e.target.value)}
                                  className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                          <button
                            type="button"
                            onClick={saveDetails}
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                            {t('adminUserDetails.saveChanges')}
                          </button>
                          {!isSelf(selectedUser) && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(selectedUser.id, selectedUser.enabled)}
                                disabled={updatingId === selectedUser.id}
                                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${selectedUser.enabled ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                              >
                                {updatingId === selectedUser.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : (selectedUser.enabled ? <NoSymbolIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />)}
                                {selectedUser.enabled ? t('adminDashboard.block') : t('adminDashboard.approve')}
                              </button>
                              <button
                                type="button"
                                onClick={() => forceLogout(selectedUser.id)}
                                disabled={forcingLogoutId === selectedUser.id}
                                className="w-full py-3 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-2 transition-all"
                              >
                                {forcingLogoutId === selectedUser.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                                {t('adminDashboard.forceLogout')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModalUser(selectedUser)}
                                disabled={deletingId === selectedUser.id}
                                className="w-full py-3 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"
                              >
                                <TrashIcon className="h-4 w-4" />
                                {t('common.delete')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {deleteModalUser ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
              <div className="text-lg font-bold text-white">{t('common.delete')}</div>
              <div className="text-sm text-white/80 mt-1">{t('adminUserDetails.deleteConfirm')}</div>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{deleteModalUser.username}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{deleteModalUser.email}</div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  disabled={deletingId != null}
                  className="px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteUser(deleteModalUser.id)}
                  disabled={deletingId != null}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-semibold hover:from-red-700 hover:via-rose-700 hover:to-pink-700 disabled:opacity-60"
                >
                  {deletingId != null ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
