import api from './api';

export async function listAuditLog(page = 0) {
  const { data } = await api.get('/admin/audit-log', { params: { page, size: 30 } });
  return data.data;
}
