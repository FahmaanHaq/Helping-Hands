import api from './api';

export async function getReportsSummary() {
  const { data } = await api.get('/admin/reports/summary');
  return data.data;
}

export async function exportRequestsCsv() {
  const response = await api.get('/admin/reports/requests/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'requests-export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
