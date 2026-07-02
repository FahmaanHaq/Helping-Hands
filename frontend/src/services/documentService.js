import api from './api';

export async function uploadDocument({ ownerType, ownerId, documentType, remarks, file }) {
  const formData = new FormData();
  formData.append('ownerType', ownerType);
  formData.append('ownerId', ownerId);
  formData.append('documentType', documentType);
  if (remarks) formData.append('remarks', remarks);
  formData.append('file', file);

  const { data } = await api.post('/documents', formData, {
    headers: { 'Content-Type': undefined } // instance default is application/json; undefined lets the browser set the correct multipart boundary
  });
  return data.data;
}

export async function listDocuments(ownerType, ownerId) {
  const { data } = await api.get('/documents', { params: { ownerType, ownerId } });
  return data.data;
}

export function downloadDocumentUrl(documentId) {
  // Included here so the download link carries the JWT via the shared axios
  // instance's baseURL; actual navigation is handled by downloadDocument() below
  // since a plain <a href> wouldn't carry the Authorization header.
  return `/documents/${documentId}/download`;
}

export async function downloadDocument(documentId, fileName) {
  const response = await api.get(`/documents/${documentId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
