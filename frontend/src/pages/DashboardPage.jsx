import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard.jsx';
import VerificationStatusChart from '../components/VerificationStatusChart.jsx';
import { getVerificationStats } from '../services/dashboardService';
import { getMyChildrensHome } from '../services/childrensHomeService';
import { getMyServiceProvider } from '../services/serviceProviderService';
import { getMyRequests, browseRequests, getMyPledges } from '../services/requestService';
import { listDocuments } from '../services/documentService';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVerificationStats().then(setStats).catch(() => setError('Failed to load stats'));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return <p className="hint-text">Loading dashboard…</p>;

  const totalPending = stats.homesSubmitted + stats.homesUnderReview
    + stats.providersSubmitted + stats.providersUnderReview;
  const totalApproved = stats.homesApproved + stats.providersApproved;
  const totalRejected = stats.homesRejected + stats.providersRejected;
  const totalProfiles = totalPending + totalApproved + totalRejected;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Pending Review" value={totalPending} accent="amber" />
        <StatCard label="Approved" value={totalApproved} accent="green" />
        <StatCard label="Rejected" value={totalRejected} accent="red" />
        <StatCard label="Total Profiles" value={totalProfiles} accent="neutral" />
      </div>

      <VerificationStatusChart stats={stats} />

      <div className="dashboard-actions">
        <Link className="dashboard-tile" to="/admin/verification">Go to Verification Queue →</Link>
        <Link className="dashboard-tile" to="/requests">View All Requests →</Link>
      </div>
    </>
  );
}

function ChildrensHomeDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [docCount, setDocCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildrensHome()
      .then(async (p) => {
        setProfile(p);
        const [reqPage, docs] = await Promise.all([
          getMyRequests().catch(() => ({ content: [] })),
          listDocuments('CHILDRENS_HOME', p.id).catch(() => [])
        ]);
        setRequests(reqPage.content || []);
        setDocCount(docs.length);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="hint-text">Loading…</p>;

  if (!profile) {
    return (
      <Link className="dashboard-tile dashboard-tile-cta" to="/childrens-home">
        Complete your Children&apos;s Home registration →
      </Link>
    );
  }

  const accent = profile.verificationStatus === 'APPROVED' ? 'green'
    : profile.verificationStatus === 'REJECTED' ? 'red' : 'amber';
  const activeCount = requests.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  return (
    <>
      <div className="stat-grid">
        <StatCard label={profile.homeName} value={profile.verificationStatus} accent={accent} subtitle="Verification status" />
        <StatCard label="Active Requests" value={activeCount} accent="amber" />
        <StatCard label="Completed Requests" value={completedCount} accent="green" />
        <StatCard label="Documents Uploaded" value={docCount ?? '—'} accent="neutral" />
      </div>
      <div className="dashboard-actions">
        <Link className="dashboard-tile" to="/childrens-home">View Profile & Documents →</Link>
        {profile.verificationStatus === 'APPROVED' && (
          <Link className="dashboard-tile" to="/requests/new">Create a New Request →</Link>
        )}
        <Link className="dashboard-tile" to="/requests">View My Requests →</Link>
      </div>
    </>
  );
}

function ServiceProviderDashboard() {
  const [profile, setProfile] = useState(null);
  const [docCount, setDocCount] = useState(null);
  const [pledgeCount, setPledgeCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyServiceProvider()
      .then(async (p) => {
        setProfile(p);
        const [docs, pledges] = await Promise.all([
          listDocuments('SERVICE_PROVIDER', p.id).catch(() => []),
          getMyPledges().catch(() => ({ content: [] }))
        ]);
        setDocCount(docs.length);
        setPledgeCount((pledges.content || []).length);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="hint-text">Loading…</p>;

  if (!profile) {
    return (
      <Link className="dashboard-tile dashboard-tile-cta" to="/service-provider">
        Complete your Service Provider registration →
      </Link>
    );
  }

  const accent = profile.verificationStatus === 'APPROVED' ? 'green'
    : profile.verificationStatus === 'REJECTED' ? 'red' : 'amber';

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Verification Status" value={profile.verificationStatus} accent={accent} />
        <StatCard
          label="Police Clearance"
          value={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'Verified' : 'Pending') : 'N/A'}
          accent={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'green' : 'amber') : 'neutral'}
        />
        <StatCard label="My Pledges" value={pledgeCount ?? '—'} accent="neutral" />
        <StatCard label="Documents Uploaded" value={docCount ?? '—'} accent="neutral" />
      </div>
      <div className="dashboard-actions">
        <Link className="dashboard-tile" to="/service-provider">View Profile & Documents →</Link>
        <Link className="dashboard-tile" to="/requests">Browse Service Requests →</Link>
      </div>
    </>
  );
}

function DonorDashboard() {
  const [openCount, setOpenCount] = useState(null);
  const [pledgeCount, setPledgeCount] = useState(null);

  useEffect(() => {
    Promise.all([
      browseRequests('CREATED').catch(() => ({ content: [] })),
      getMyPledges().catch(() => ({ content: [] }))
    ]).then(([openPage, pledgesPage]) => {
      const openGoods = (openPage.content || []).filter((r) => r.requestType === 'GOODS');
      setOpenCount(openGoods.length);
      setPledgeCount((pledgesPage.content || []).length);
    });
  }, []);

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Open Goods Requests" value={openCount ?? '—'} accent="amber" />
        <StatCard label="My Pledges" value={pledgeCount ?? '—'} accent="green" />
      </div>
      <div className="dashboard-actions">
        <Link className="dashboard-tile" to="/requests">Browse Donation Requests →</Link>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="hint-text">Welcome back, <strong>{user?.username}</strong> · {user?.roles?.join(', ')}</p>
        </div>
      </header>

      {hasRole('ADMINISTRATOR') && <AdminDashboard />}
      {hasRole('CHILDRENS_HOME') && <ChildrensHomeDashboard />}
      {hasRole('SERVICE_PROVIDER') && <ServiceProviderDashboard />}
      {hasRole('DONOR') && <DonorDashboard />}
    </div>
  );
}
