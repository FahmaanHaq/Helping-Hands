import api from './api';

export async function getFeaturedRequests() {
  const { data } = await api.get('/public/featured-requests');
  return data.data;
}
