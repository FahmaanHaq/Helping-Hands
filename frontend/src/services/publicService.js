import api from './api';

export async function getFeaturedRequests() {
  const { data } = await api.get('/public/featured-requests');
  return data.data;
}

export async function getImpactStats() {
  const { data } = await api.get('/public/impact-stats');
  return data.data;
}
