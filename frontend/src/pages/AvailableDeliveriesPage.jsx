import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { getAvailableDeliveries, claimDelivery } from '../services/requestService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { useModal } from '../hooks/useModal';

export default function AvailableDeliveriesPage() {
  const { confirmDialog, alertDialog } = useModal();
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPageData(await getAvailableDeliveries(page));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = async (request) => {
    const ok = await confirmDialog({
      title: `Claim delivery for "${request.title}"?`,
      message: `You'll be responsible for picking up and delivering this donation to ${request.childrensHomeName}.`,
      confirmLabel: 'Claim Delivery'
    });
    if (!ok) return;
    try {
      await claimDelivery(request.id);
      load();
    } catch (err) {
      await alertDialog({ title: 'Failed to claim delivery', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  const requests = pageData?.content || [];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <h1>Available Deliveries</h1>
          <p className="hint-text">Donors who asked for a delivery volunteer, waiting for someone to claim them.</p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="hint-text">No deliveries need a volunteer right now — check back soon.</p>
      ) : (
        <>
          <div className="request-list">
            {requests.map((r) => (
              <div key={r.id} className="verification-card">
                <div>
                  <Link to={`/requests/${r.id}`}><strong>{r.title}</strong></Link>
                  <div className="hint-text">{r.childrensHomeName} · Pledged by {r.pledgedByUsername}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <RequestStatusBadge status={r.status} />
                  <button type="button" onClick={() => handleClaim(r)}>
                    <Truck size={14} /> Claim Delivery
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pageData={pageData} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
