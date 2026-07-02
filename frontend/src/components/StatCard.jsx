import React from 'react';

const ACCENTS = {
  green: '#1f6f50',
  amber: '#a5720a',
  red: '#b3261e',
  neutral: '#3a3d38'
};

export default function StatCard({ label, value, accent = 'neutral', subtitle }) {
  return (
    <div className="stat-card" style={{ borderTopColor: ACCENTS[accent] }}>
      <div className="stat-card-value" style={{ color: ACCENTS[accent] }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
}
