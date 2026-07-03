import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#1f6f50', '#a5720a', '#3a5a8c', '#b3261e', '#6b6f68'];

/**
 * Rendered as a donut (innerRadius > 0) with the total in the center — the
 * number people scan for first. The legend is custom-built below the chart
 * rather than using Recharts' built-in Legend: with the built-in legend
 * sharing the same container as the pie, the container's vertical center
 * (where the CSS-positioned total label sits) doesn't match the pie's own
 * visual center — a separate legend row keeps the math simple and exact.
 */
export default function RequestBreakdownChart({ data, title, centerLabel = 'Total' }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const isEmpty = total === 0;

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {isEmpty ? (
        <div className="chart-card-empty">
          <PieChartIcon size={32} />
          <span>Nothing to show yet</span>
        </div>
      ) : (
        <>
          <div className="donut-chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-chart-center">
              <div className="donut-chart-center-value">{total}</div>
              <div className="donut-chart-center-label">{centerLabel}</div>
            </div>
          </div>
          <div className="donut-legend">
            {data.map((d, i) => (
              <div key={d.name} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
