import api from './api';

export async function listMessages(requestId) {
  const { data } = await api.get(`/requests/${requestId}/messages`);
  return data.data;
}

export async function sendMessage(requestId, content) {
  const { data } = await api.post(`/requests/${requestId}/messages`, { content });
  return data.data;
}
