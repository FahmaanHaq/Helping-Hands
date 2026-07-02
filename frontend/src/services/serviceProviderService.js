import api from './api';

export async function registerServiceProvider(payload) {
  const { data } = await api.post('/service-providers/me', payload);
  return data.data;
}

export async function getMyServiceProvider() {
  const { data } = await api.get('/service-providers/me');
  return data.data;
}
