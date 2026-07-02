import React, { useEffect, useState } from 'react';
import { Download, Star } from 'lucide-react';
import { getReportsSummary, exportRequestsCsv } from '../services/reportsService';
import StatCard from '../components/StatCard.jsx';
import RequestBreakdownChart from '../components/RequestBreakdownChart.jsx';

export default function AdminReportsPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getReportsSummary().then(setSummary).catch(() => setError('Failed to load reports'));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRequestsCsv();
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!summary) return <div className="page"><p className="hint-text">Loading reports…</p></div>;

  const typeData = [
    { name: 'Goods Requests', value: summary.totalGoodsRequests },
    { name: 'Service Requests', value: summary.totalServiceRequests }
  ];

  const statusData = [
    { name: 'Active', value: summary.activeRequests },
    { name: 'Completed', value: summary.completedRequests },
    { name: 'Cancelled', value: summary.cancelledRequests }
  ];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <h1>Reports</h1>
        <button className="btn-primary" onClick={handleExport} disabled={exporting}>
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export Requests (CSV)'}
        </button>
      </header>

      <div className="stat-grid">
        <StatCard label="Active Requests" value={summary.activeRequests} accent="amber" />
        <StatCard label="Completed Requests" value={summary.completedRequests} accent="green" />
        <StatCard label="Cancelled Requests" value={summary.cancelledRequests} accent="red" />
        <StatCard label="Suspended Users" value={summary.suspendedUsers} accent="neutral" />
      </div>

      <div className="stat-grid">
        <StatCard label="Donors" value={summary.totalDonors} accent="neutral" />
        <StatCard label="Service Providers" value={summary.totalServiceProviders} accent="neutral" />
        <StatCard label="Children's Homes" value={summary.totalChildrensHomes} accent="neutral" />
        <StatCard
          label="Platform Avg Rating"
          value={summary.platformAverageRating ? summary.platformAverageRating.toFixed(1) : '—'}
          accent="amber"
          subtitle={`${summary.totalRatingsSubmitted} ratings submitted`}
        />
      </div>

      <div className="two-col-charts">
        <RequestBreakdownChart data={typeData} title="Requests by Type" />
        <RequestBreakdownChart data={statusData} title="Requests by Outcome" />
      </div>

      <p className="hint-text">
        <Star size={14} style={{ verticalAlign: 'text-bottom' }} /> PDF export isn&apos;t implemented yet —
        CSV covers the Excel-export requirement without adding a heavy PDF dependency to the MVP.
      </p>
    </div>
  );
}
