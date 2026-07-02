import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard.jsx';
import VerificationStatusChart from '../components/VerificationStatusChart.jsx';
import { getVerificationStats } from '../services/dashboardService';
import { getMyChildrensHome } from '../services/childrensHomeService';
import { getMyServiceProvider } from '../services/serviceProviderService';

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

      <Link className="dashboard-tile" to="/admin/verification">
        Go to Verification Queue →
      </Link>
    </>
  );
}

function ChildrensHomeDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildrensHome().then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
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

  return (
    <div className="stat-grid">
      <StatCard label={profile.homeName} value={profile.verificationStatus} accent={accent} subtitle="Verification status" />
      <Link className="dashboard-tile" to="/childrens-home">
        View Profile & Documents →
      </Link>
    </div>
  );
}

function ServiceProviderDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyServiceProvider().then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
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
    <div className="stat-grid">
      <StatCard label="Verification Status" value={profile.verificationStatus} accent={accent} />
      <StatCard
        label="Police Clearance"
        value={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'Verified' : 'Pending') : 'N/A'}
        accent={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'green' : 'amber') : 'neutral'}
      />
      <Link className="dashboard-tile" to="/service-provider">
        View Profile & Documents →
      </Link>
    </div>
  );
}

function DonorDashboard() {
  return (
    <div className="stat-grid">
      <StatCard label="Donations Made" value="—" accent="neutral" subtitle="Requests module coming soon" />
      <StatCard label="Homes Supported" value="—" accent="neutral" subtitle="Requests module coming soon" />
      <div className="dashboard-tile dashboard-tile-disabled">
        Browse Donation Requests — coming in a later module
      </div>
    </div>
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
