import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { browseFlaggedRequests } from '../services/requestService';
import { flagRequest } from '../services/moderationService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';

export default function AdminFlaggedContentPage() {
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await browseFlaggedRequests(page);
      setPageData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flagged content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearFlag = async (request) => {
    if (!window.confirm('Clear the flag on this request?')) return;
    try {
      await flagRequest(request.id, false, null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear flag');
    }
  };

  const requests = pageData?.content || [];

  return (
    <div className="page page-wide">
      <h1>Flagged Content</h1>
      <p className="hint-text">
        Requests flagged as inappropriate, across all lifecycle statuses. Clearing a
        flag restores visibility in the public marketplace; it doesn&apos;t change the
        request&apos;s underlying status.
      </p>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="hint-text">Nothing currently flagged.</p>
      ) : (
        <div className="request-list">
          {requests.map((r) => (
            <div key={r.id} className="verification-card">
              <div>
                <Link to={`/requests/${r.id}`}><strong>{r.title}</strong></Link>
                <div className="hint-text">{r.childrensHomeName} · {r.requestType}</div>
                <div className="form-error">Reason: {r.flagReason}</div>
                <RequestStatusBadge status={r.status} />
              </div>
              <div className="verification-actions">
                <button onClick={() => handleClearFlag(r)}>Clear Flag</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pageData={pageData} onPageChange={setPage} />
    </div>
  );
}
