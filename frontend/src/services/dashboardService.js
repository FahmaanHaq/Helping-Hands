import api from './api';

export async function getVerificationStats() {
  const { data } = await api.get('/admin/dashboard/verification-stats');
  return data.data;
}
