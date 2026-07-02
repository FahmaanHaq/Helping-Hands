import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1f6f50', '#a5720a', '#3a5a8c', '#b3261e', '#6b6f68'];

export default function RequestBreakdownChart({ data, title }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
