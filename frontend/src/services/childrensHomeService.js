import api from './api';

export async function registerChildrensHome(payload) {
  const { data } = await api.post('/childrens-homes/me', payload);
  return data.data;
}

export async function getMyChildrensHome() {
  const { data } = await api.get('/childrens-homes/me');
  return data.data;
}

export async function resubmitChildrensHome(payload) {
  const { data } = await api.put('/childrens-homes/me/resubmit', payload);
  return data.data;
}
