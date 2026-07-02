import api from './api';

export async function listPendingChildrensHomes(status = 'SUBMITTED') {
  const { data } = await api.get('/admin/verification/childrens-homes', { params: { status } });
  return data.data; // Page<ChildrensHomeResponse>
}

export async function decideChildrensHome(id, decision, rejectionReason) {
  const { data } = await api.patch(`/admin/verification/childrens-homes/${id}`, {
    decision,
    rejectionReason
  });
  return data.data;
}

export async function listPendingServiceProviders(status = 'SUBMITTED') {
  const { data } = await api.get('/admin/verification/service-providers', { params: { status } });
  return data.data;
}

export async function decideServiceProvider(id, decision, rejectionReason, policeClearanceVerified) {
  const { data } = await api.patch(`/admin/verification/service-providers/${id}`, {
    decision,
    rejectionReason,
    policeClearanceVerified
  });
  return data.data;
}
