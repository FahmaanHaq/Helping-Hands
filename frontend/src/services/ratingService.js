import api from './api';

export async function submitRating(requestId, score, comment) {
  const { data } = await api.post(`/requests/${requestId}/rating`, { score, comment });
  return data.data;
}

export async function getRatingForRequest(requestId) {
  const { data } = await api.get(`/requests/${requestId}/rating`);
  return data.data;
}

export async function getReputation(userId) {
  const { data } = await api.get(`/users/${userId}/reputation`);
  return data.data;
}
