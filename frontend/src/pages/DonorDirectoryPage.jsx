import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { listDonorsDirectory } from '../services/directoryService';

export default function DonorDirectoryPage() {
  const [donors, setDonors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDonorsDirectory().then(setDonors).catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, []);

  return (
    <div className="page page-wide">
      <h1>Browse Donors</h1>
      <p className="hint-text">
        Public reputation only — contact details stay private on this platform.
      </p>

      {error && <p className="form-error">{error}</p>}
      {!donors ? (
        <p className="hint-text">Loading…</p>
      ) : donors.length === 0 ? (
        <p className="hint-text">No donors registered yet.</p>
      ) : (
        <div className="request-list">
          {donors.map((d) => (
            <div key={d.id} className="verification-card">
              <div>
                <strong>{d.fullName}</strong>
                <div className="hint-text">@{d.username}</div>
              </div>
              <div className="reputation-badge">
                {d.totalRatings > 0 ? (
                  <>
                    <Star size={14} fill="#a5720a" color="#a5720a" />
                    {d.averageRating.toFixed(1)} ({d.totalRatings})
                  </>
                ) : (
                  <span className="hint-text">No ratings yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
