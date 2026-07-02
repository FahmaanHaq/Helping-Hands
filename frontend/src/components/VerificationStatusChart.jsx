import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * stats: VerificationStatsResponse shape from the backend
 * { homesSubmitted, homesUnderReview, homesApproved, homesRejected,
 *   providersSubmitted, providersUnderReview, providersApproved, providersRejected }
 */
export default function VerificationStatusChart({ stats }) {
  const data = [
    {
      status: 'Submitted',
      "Children's Homes": stats.homesSubmitted,
      'Service Providers': stats.providersSubmitted
    },
    {
      status: 'Under Review',
      "Children's Homes": stats.homesUnderReview,
      'Service Providers': stats.providersUnderReview
    },
    {
      status: 'Approved',
      "Children's Homes": stats.homesApproved,
      'Service Providers': stats.providersApproved
    },
    {
      status: 'Rejected',
      "Children's Homes": stats.homesRejected,
      'Service Providers': stats.providersRejected
    }
  ];

  return (
    <div className="chart-card">
      <h3>Verification Status Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceee9" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Children's Homes" fill="#1f6f50" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Service Providers" fill="#a5720a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
