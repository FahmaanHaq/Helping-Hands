import api from './api';

export async function listDonorsDirectory() {
  const { data } = await api.get('/directory/donors');
  return data.data;
}

export async function listServiceProvidersDirectory() {
  const { data } = await api.get('/directory/service-providers');
  return data.data;
}
