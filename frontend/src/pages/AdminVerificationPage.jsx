import React, { useEffect, useState } from 'react';
import {
  listPendingChildrensHomes, decideChildrensHome,
  listPendingServiceProviders, decideServiceProvider
} from '../services/verificationService';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AdminVerificationPage() {
  const [homes, setHomes] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [homesPage, providersPage] = await Promise.all([
        listPendingChildrensHomes('SUBMITTED'),
        listPendingServiceProviders('SUBMITTED')
      ]);
      setHomes(homesPage.content || []);
      setProviders(providersPage.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleHomeDecision = async (id, decision) => {
    let reason = null;
    if (decision === 'REJECTED') {
      reason = window.prompt('Reason for rejection:');
      if (!reason) return;
    }
    try {
      await decideChildrensHome(id, decision, reason);
      setHomes((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Decision failed');
    }
  };

  const handleProviderDecision = async (id, decision, policeClearanceRequired) => {
    let reason = null;
    let clearanceVerified = undefined;
    if (decision === 'REJECTED') {
      reason = window.prompt('Reason for rejection:');
      if (!reason) return;
    }
    if (decision === 'APPROVED' && policeClearanceRequired) {
      clearanceVerified = window.confirm(
        'This provider is onsite and requires police clearance. Click OK to confirm you\'ve verified their clearance document, or Cancel to abort.'
      );
      if (!clearanceVerified) return;
    }
    try {
      await decideServiceProvider(id, decision, reason, clearanceVerified);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Decision failed');
    }
  };

  if (loading) return <div className="page">Loading pending verifications…</div>;

  return (
    <div className="page page-wide">
      <h1>Verification Queue</h1>
      {error && <p className="form-error">{error}</p>}

      <section>
        <h2>Children&apos;s Homes ({homes.length} pending)</h2>
        {homes.length === 0 && <p className="hint-text">Nothing pending.</p>}
        {homes.map((home) => (
          <div key={home.id} className="verification-card">
            <div>
              <strong>{home.homeName}</strong> — Reg #{home.registrationNumber}
              <div className="hint-text">{home.contactEmail} · {home.contactNumber}</div>
              <div className="hint-text">{home.address}</div>
              <StatusBadge status={home.verificationStatus} />
            </div>
            <div className="verification-actions">
              <button onClick={() => handleHomeDecision(home.id, 'APPROVED')}>Approve</button>
              <button className="btn-danger" onClick={() => handleHomeDecision(home.id, 'REJECTED')}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Service Providers ({providers.length} pending)</h2>
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
      </section>
    </div>
  );
}
