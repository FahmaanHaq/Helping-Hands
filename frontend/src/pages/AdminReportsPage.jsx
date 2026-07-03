import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { getReportsSummary, exportRequestsCsv, exportReportPdf } from '../services/reportsService';
import StatCard from '../components/StatCard.jsx';
import RequestBreakdownChart from '../components/RequestBreakdownChart.jsx';
import { useModal } from '../hooks/useModal';

export default function AdminReportsPage() {
  const { alertDialog } = useModal();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    getReportsSummary().then(setSummary).catch(() => setError('Failed to load reports'));
  }, []);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await exportRequestsCsv();
    } catch {
      await alertDialog({ title: 'Export failed', message: 'Please try again.' });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportReportPdf();
    } catch {
      await alertDialog({ title: 'Export failed', message: 'Please try again.' });
    } finally {
      setExportingPdf(false);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" onClick={handleExportCsv} disabled={exportingCsv}>
            <Download size={16} /> {exportingCsv ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn-primary" onClick={handleExportPdf} disabled={exportingPdf}>
            <FileText size={16} /> {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
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
    </div>
  );
}
