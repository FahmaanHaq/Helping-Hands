import React from 'react';

const ACCENTS = {
  green: '#1f6f50',
  amber: '#a5720a',
  red: '#b3261e',
  neutral: '#3a3d38'
};

const ACCENT_TINTS = {
  green: 'rgba(31, 111, 80, 0.1)',
  amber: 'rgba(165, 114, 10, 0.1)',
  red: 'rgba(179, 38, 30, 0.1)',
  neutral: 'rgba(58, 61, 56, 0.08)'
};

export default function StatCard({ label, value, accent = 'neutral', subtitle, icon: Icon }) {
  return (
    <div className="stat-card" style={{ borderTopColor: ACCENTS[accent] }}>
      {Icon && (
        <div className="stat-card-icon" style={{ background: ACCENT_TINTS[accent], color: ACCENTS[accent] }}>
          <Icon size={18} />
        </div>
      )}
      <div className="stat-card-value" style={{ color: ACCENTS[accent] }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
}
