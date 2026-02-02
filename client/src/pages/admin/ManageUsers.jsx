import { useEffect, useState } from 'react';
import axios from '../../services/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../services/toast';
import { useAuth } from '../../hooks/useAuth';

export default function ManageUsers() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

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

  const toggleUserStatus = async (id, enabled) => {
    const toastId = `admin-user-status-${id || 'unknown'}`;
    try {
      setUpdatingId(id);
      await axios.put(`/admin/users/${id}/status?enabled=${!enabled}`);
      await fetchUsers();
      showToast(toastId, 'info', t(!enabled ? 'adminDashboard.approve' : 'adminDashboard.block'));
    } catch (err) {
      console.error('Failed to update user status:', err);
      showToast(toastId, 'error', t('adminDashboard.failedUpdateStatus'));
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (id) => {
    const toastId = `admin-user-delete-${id || 'unknown'}`;
    try {
      setDeletingId(id);
      await axios.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
      showToast(toastId, 'success', t('adminDashboard.userDeleted'));
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast(toastId, 'error', t('adminDashboard.failedDeleteUser'));
    } finally {
      setDeletingId(null);
      setDeleteModalUser(null);
    }
  };

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

  const myEmail = (auth?.email || '').trim().toLowerCase();
  const isSelf = (u) => {
    const email = (u?.email || '').trim().toLowerCase();
    return !!myEmail && !!email && email === myEmail;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{t('adminDashboard.manageUsers')}</h1>
                <p className="text-white/80 text-sm mt-1">{t('adminDashboard.clickRowHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
              >
                {t('common.dashboard')}
              </button>
            </div>
          </div>

          <div className="p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200 mb-6">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div className="w-full md:max-w-md">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`${t('adminDashboard.username')} / ${t('adminDashboard.email')} / ${t('adminDashboard.role')}`}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={fetchUsers}
                className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('common.refresh')}
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('adminDashboard.loadingUsers')}</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">#</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">{t('adminDashboard.username')}</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">{t('adminDashboard.email')}</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">{t('adminDashboard.role')}</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">{t('adminDashboard.status')}</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wide">{t('adminDashboard.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 dark:text-gray-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.id}
                          className="border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                        >
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{u.username}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">{u.role}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                u.enabled
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                              }`}
                            >
                              {u.enabled ? t('adminDashboard.active') : t('adminDashboard.blocked')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isSelf(u) ? null : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteModalUser(u);
                                  }}
                                  disabled={deletingId === u.id || updatingId === u.id}
                                  className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-black disabled:opacity-60"
                                >
                                  {t('common.delete')}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUserStatus(u.id, u.enabled);
                                  }}
                                  disabled={deletingId === u.id || updatingId === u.id}
                                  className={`px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${
                                    u.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                  }`}
                                >
                                  {updatingId === u.id ? t('common.pleaseWait') : (u.enabled ? t('adminDashboard.block') : t('adminDashboard.approve'))}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-6 text-center text-gray-500 dark:text-gray-400" colSpan="6">
                          {t('adminDashboard.noUsersFound')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteModalUser ? (
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
