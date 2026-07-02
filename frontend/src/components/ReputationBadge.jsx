import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getReputation } from '../services/ratingService';

export default function ReputationBadge({ userId }) {
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    if (!userId) return;
    getReputation(userId).then(setReputation).catch(() => setReputation(null));
  }, [userId]);

  if (!reputation) return null;
  if (reputation.totalRatings === 0) {
    return <span className="hint-text">No ratings yet</span>;
  }

  return (
    <span className="reputation-badge" title={`${reputation.totalRatings} rating(s)`}>
      <Star size={14} fill="#a5720a" color="#a5720a" />
      {reputation.averageScore.toFixed(1)} ({reputation.totalRatings})
      {reputation.restricted && <span className="reputation-restricted">Restricted</span>}
    </span>
  );
}
