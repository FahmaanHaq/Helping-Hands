import React, { useEffect, useState } from 'react';
import {
  listPendingChildrensHomes, decideChildrensHome,
  listPendingServiceProviders, decideServiceProvider
} from '../services/verificationService';
import StatusBadge from '../components/StatusBadge.jsx';
import ApplicantDocuments from '../components/ApplicantDocuments.jsx';
import Pagination from '../components/Pagination.jsx';
import { useModal } from '../hooks/useModal';

export default function AdminVerificationPage() {
  const { promptDialog, confirmDialog, alertDialog } = useModal();
  const [homesPage, setHomesPage] = useState(null);
  const [providersPage, setProvidersPage] = useState(null);
  const [homesPageNum, setHomesPageNum] = useState(0);
  const [providersPageNum, setProvidersPageNum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [homes, providers] = await Promise.all([
        listPendingChildrensHomes('SUBMITTED', homesPageNum),
        listPendingServiceProviders('SUBMITTED', providersPageNum)
      ]);
      setHomesPage(homes);
      setProvidersPage(providers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [homesPageNum, providersPageNum]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHomeDecision = async (id, decision) => {
    let reason = null;
    if (decision === 'REJECTED') {
      reason = await promptDialog({
        title: 'Reject this Children\'s Home?',
        placeholder: 'Reason for rejection',
        confirmLabel: 'Reject',
        danger: true,
        required: true
      });
      if (!reason) return;
    }
    try {
      await decideChildrensHome(id, decision, reason);
      loadAll();
    } catch (err) {
      await alertDialog({ title: 'Decision failed', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  const handleProviderDecision = async (id, decision, policeClearanceRequired) => {
    let reason = null;
    let clearanceVerified = undefined;
    if (decision === 'REJECTED') {
      reason = await promptDialog({
        title: 'Reject this Service Provider?',
        placeholder: 'Reason for rejection',
        confirmLabel: 'Reject',
        danger: true,
        required: true
      });
      if (!reason) return;
    }
    if (decision === 'APPROVED' && policeClearanceRequired) {
      clearanceVerified = await confirmDialog({
        title: 'Confirm police clearance verified',
        message: 'This provider is onsite and requires police clearance. Confirm you\'ve personally verified their uploaded clearance document before approving.',
        confirmLabel: 'Yes, verified — Approve'
      });
      if (!clearanceVerified) return;
    }
    try {
      await decideServiceProvider(id, decision, reason, clearanceVerified);
      loadAll();
    } catch (err) {
      await alertDialog({ title: 'Decision failed', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  if (loading) return <div className="page">Loading pending verifications…</div>;

  const homes = homesPage?.content || [];
  const providers = providersPage?.content || [];

  return (
    <div className="page page-wide">
      <h1>Verification Queue</h1>
      {error && <p className="form-error">{error}</p>}

      <section>
        <h2>Children&apos;s Homes ({homesPage?.totalElements ?? 0} pending)</h2>
        {homes.length === 0 && <p className="hint-text">Nothing pending.</p>}
        {homes.map((home) => (
          <div key={home.id} className="verification-card">
            <div>
              <strong>{home.homeName}</strong> — Reg #{home.registrationNumber}
              <div className="hint-text">{home.contactEmail} · {home.contactNumber}</div>
              <div className="hint-text">{home.address}</div>
              <StatusBadge status={home.verificationStatus} />
              <ApplicantDocuments ownerType="CHILDRENS_HOME" ownerId={home.id} />
            </div>
            <div className="verification-actions">
              <button onClick={() => handleHomeDecision(home.id, 'APPROVED')}>Approve</button>
              <button className="btn-danger" onClick={() => handleHomeDecision(home.id, 'REJECTED')}>Reject</button>
            </div>
          </div>
        ))}
        <Pagination pageData={homesPage} onPageChange={setHomesPageNum} />
      </section>

      <section>
        <h2>Service Providers ({providersPage?.totalElements ?? 0} pending)</h2>
        {providers.length === 0 && <p className="hint-text">Nothing pending.</p>}
        {providers.map((provider) => (
          <div key={provider.id} className="verification-card">
            <div>
              <strong>{provider.skills}</strong>
              <div className="hint-text">Categories: {provider.serviceCategories.join(', ')}</div>
              <div className="hint-text">
                Mode: {provider.serviceMode} · Police clearance:{' '}
                {provider.policeClearanceRequired ? 'Required' : 'Not required'}
              </div>
              <StatusBadge status={provider.verificationStatus} />
              <ApplicantDocuments ownerType="SERVICE_PROVIDER" ownerId={provider.id} />
            </div>
            <div className="verification-actions">
              <button onClick={() => handleProviderDecision(provider.id, 'APPROVED', provider.policeClearanceRequired)}>
                Approve
              </button>
              <button className="btn-danger" onClick={() => handleProviderDecision(provider.id, 'REJECTED', provider.policeClearanceRequired)}>
                Reject
              </button>
            </div>
          </div>
        ))}
        <Pagination pageData={providersPage} onPageChange={setProvidersPageNum} />
      </section>
    </div>
  );
}
