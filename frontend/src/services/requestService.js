import api from './api';

export async function createRequest(payload) {
  const { data } = await api.post('/requests', payload);
  return data.data;
}

export async function updateRequest(id, payload) {
  const { data } = await api.patch(`/requests/${id}`, payload);
  return data.data;
}

export async function getRequest(id) {
  const { data } = await api.get(`/requests/${id}`);
  return data.data;
}

export async function browseRequests(status) {
  const { data } = await api.get('/requests', { params: { status, size: 50 } });
  return data.data; // Page<RequestResponse>
}

export async function getMyRequests() {
  const { data } = await api.get('/requests/me', { params: { size: 50 } });
  return data.data;
}

export async function getMyPledges() {
  const { data } = await api.get('/requests/my-pledges', { params: { size: 50 } });
  return data.data;
}

export async function getRequestHistory(id) {
  const { data } = await api.get(`/requests/${id}/history`);
  return data.data;
}

export async function changeRequestStatus(id, status, remarks) {
  const { data } = await api.patch(`/requests/${id}/status`, { status, remarks });
  return data.data;
}
