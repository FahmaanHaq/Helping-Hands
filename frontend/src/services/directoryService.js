import api from './api';

export async function listDonorsDirectory(page = 0) {
  const { data } = await api.get('/directory/donors', { params: { page, size: 20 } });
  return data.data; // Page<DirectoryUserResponse>
}

export async function listServiceProvidersDirectory(page = 0) {
  const { data } = await api.get('/directory/service-providers', { params: { page, size: 20 } });
  return data.data;
}
