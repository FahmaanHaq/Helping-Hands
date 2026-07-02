import React, { useEffect, useState } from 'react';
import { listAuditLog } from '../services/auditLogService';
import Pagination from '../components/Pagination.jsx';

export default function AdminAuditLogPage() {
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    listAuditLog(page)
      .then(setPageData)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [page]);

  const entries = pageData?.content || [];

  return (
    <div className="page page-wide">
      <h1>Audit Log</h1>
      <p className="hint-text">Read-only history of significant platform actions.</p>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="hint-text">No entries yet.</p>
      ) : (
        <>
          <div className="status-timeline" style={{ maxWidth: 'none' }}>
            {entries.map((e) => (
              <div key={e.id} className="status-timeline-item">
                <span className="audit-action-pill">{e.actionType.replace(/_/g, ' ')}</span>
                <span className="hint-text">
                  {e.performedBy} · {e.targetType ? `${e.targetType} #${e.targetId}` : ''} ·{' '}
                  {new Date(e.createdDate).toLocaleString()}
                  {e.details ? ` · ${e.details}` : ''}
                </span>
              </div>
            ))}
          </div>
          <Pagination pageData={pageData} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
