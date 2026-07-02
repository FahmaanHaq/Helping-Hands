import api from './api';

export async function listNotifications(page = 0) {
  const { data } = await api.get('/notifications', { params: { page, size: 15 } });
  return data.data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.data;
}

export async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
