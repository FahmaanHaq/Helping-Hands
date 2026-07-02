import React from 'react';

const COLORS = {
  SUBMITTED: '#8a6d00',
  UNDER_REVIEW: '#8a6d00',
  APPROVED: '#1f6f50',
  REJECTED: '#b3261e'
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || '#555';
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: '999px',
        padding: '0.15rem 0.75rem',
        fontSize: '0.8rem',
        fontWeight: 600
      }}
    >
      {status}
    </span>
  );
}
