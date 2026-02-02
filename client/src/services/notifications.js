import axios from './axios';

function emitChange() {
  window.dispatchEvent(new Event('notifications:changed'));
}

export async function fetchNotifications(params = {}) {
  const res = await axios.get('/notifications', { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchUnreadCount() {
  const res = await axios.get('/notifications/unread-count');
  return res.data?.unreadCount ?? 0;
}

export async function markRead(id) {
  if (!id) return;
  await axios.put(`/notifications/${id}/read`);
  emitChange();
}

export async function markAllRead() {
  await axios.put('/notifications/read-all');
  emitChange();
}

export async function clearAllNotifications() {
  await axios.delete('/notifications');
  emitChange();
}

export function subscribeToNotifications(callback) {
  if (typeof callback !== 'function') return () => {};

  const handler = () => callback();
  window.addEventListener('notifications:changed', handler);
  return () => {
    window.removeEventListener('notifications:changed', handler);
  };
}
