import api from './api';

export async function flagRequest(id, flagged, reason) {
  const { data } = await api.patch(`/admin/moderation/requests/${id}/flag`, { flagged, reason });
  return data.data;
}

export async function removeDocument(id) {
  const { data } = await api.delete(`/admin/moderation/documents/${id}`);
  return data;
}
