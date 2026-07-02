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

const PAGE_SIZE = 10;

export async function browseRequests(status, filters = {}, page = 0) {
  const { data } = await api.get('/requests', { params: { status, size: PAGE_SIZE, page, ...filters } });
  return data.data; // Page<RequestResponse>
}

export async function getMyRequests(page = 0) {
  const { data } = await api.get('/requests/me', { params: { size: PAGE_SIZE, page } });
  return data.data;
}

export async function getMyPledges(page = 0) {
  const { data } = await api.get('/requests/my-pledges', { params: { size: PAGE_SIZE, page } });
  return data.data;
}

export async function getRequestHistory(id) {
  const { data } = await api.get(`/requests/${id}/history`);
  return data.data;
}

export async function browseFlaggedRequests(page = 0) {
  const { data } = await api.get('/requests', { params: { flagged: true, size: PAGE_SIZE, page } });
  return data.data;
}

export async function changeRequestStatus(id, status, remarks, deliveryMethod, courierDetails) {
  const { data } = await api.patch(`/requests/${id}/status`, { status, remarks, deliveryMethod, courierDetails });
  return data.data;
}

export async function getRecommendedRequests() {
  const { data } = await api.get('/requests/recommended');
  return data.data;
}
