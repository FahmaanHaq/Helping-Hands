import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { browseRequests, getMyRequests, getMyPledges } from '../services/requestService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';

const STATUS_OPTIONS = ['CREATED', 'PLEDGED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

function RequestRow({ request }) {
  const categoryLabel = request.requestType === 'GOODS' ? request.goodsCategory : request.serviceCategory;
  return (
    <Link to={`/requests/${request.id}`} className="request-row">
      <div className="request-row-main">
        <strong>{request.title}</strong>
        <div className="hint-text">
          {request.childrensHomeName} · {request.requestType} · {categoryLabel?.replace('_', ' ')}
          {request.requestType === 'GOODS' && request.quantity ? ` · Qty ${request.quantity}` : ''}
        </div>
      </div>
      <div className="request-row-meta">
        <span className={`urgency-pill urgency-${request.urgency.toLowerCase()}`}>{request.urgency}</span>
        <RequestStatusBadge status={request.status} />
      </div>
    </Link>
  );
}

export default function RequestsListPage() {
  const { hasRole } = useAuth();
  const isHome = hasRole('CHILDRENS_HOME');
  const isMarketplaceRole = hasRole('DONOR') || hasRole('SERVICE_PROVIDER');
  const isAdmin = hasRole('ADMINISTRATOR');

  const [requests, setRequests] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [adminStatus, setAdminStatus] = useState('CREATED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isHome) {
        const page = await getMyRequests();
        setRequests(page.content || []);
      } else if (isAdmin) {
        const page = await browseRequests(adminStatus);
        setRequests(page.content || []);
      } else if (isMarketplaceRole) {
        const [openPage, pledgesPage] = await Promise.all([
          browseRequests('CREATED'),
          getMyPledges()
        ]);
        setRequests(openPage.content || []);
        setPledges(pledgesPage.content || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [adminStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page page-wide">
      <header className="page-header">
        <h1>{isHome ? 'My Requests' : isAdmin ? 'All Requests' : 'Open Requests'}</h1>
        {isHome && (
          <Link className="btn-primary" to="/requests/new">
            <Plus size={16} /> New Request
          </Link>
        )}
      </header>

      {isAdmin && (
        <label className="inline-filter">
          Filter by status
          <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="hint-text">
          {isHome ? "You haven't created any requests yet." : 'Nothing here right now.'}
        </p>
      ) : (
        <div className="request-list">
          {requests.map((r) => <RequestRow key={r.id} request={r} />)}
        </div>
      )}

      {isMarketplaceRole && (
        <>
          <h2 style={{ marginTop: '2rem' }}>My Pledges</h2>
          {pledges.length === 0 ? (
            <p className="hint-text">You haven&apos;t pledged to any requests yet.</p>
          ) : (
            <div className="request-list">
              {pledges.map((r) => <RequestRow key={r.id} request={r} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
