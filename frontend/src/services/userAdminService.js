import api from './api';

export async function listUsers(search, page = 0) {
  const { data } = await api.get('/admin/users', { params: { search, page, size: 20 } });
  return data.data;
}

export async function suspendUser(id, reason) {
  const { data } = await api.patch(`/admin/users/${id}/suspend`, { reason });
  return data.data;
}

export async function reinstateUser(id) {
  const { data } = await api.patch(`/admin/users/${id}/reinstate`);
  return data.data;
}
