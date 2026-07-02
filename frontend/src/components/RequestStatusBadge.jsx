import React from 'react';

const COLORS = {
  CREATED: '#3a5a8c',
  PLEDGED: '#8a6d00',
  ACCEPTED: '#8a6d00',
  IN_PROGRESS: '#8a6d00',
  DELIVERED: '#1f6f50',
  COMPLETED: '#1f6f50',
  CANCELLED: '#b3261e'
};

export default function RequestStatusBadge({ status }) {
  const color = COLORS[status] || '#555';
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: '999px',
        padding: '0.15rem 0.75rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
