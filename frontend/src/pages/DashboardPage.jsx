import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, XCircle, Users, Home as HomeIcon,
  FileText, ShieldCheck, Package, HeartHandshake, Truck,
  ArrowRight, PackageSearch, ListChecks, PlusCircle, UserCog, Flag, BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard.jsx';
import VerificationStatusChart from '../components/VerificationStatusChart.jsx';
import RequestBreakdownChart from '../components/RequestBreakdownChart.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';
import { getVerificationStats } from '../services/dashboardService';
import { getMyChildrensHome } from '../services/childrensHomeService';
import { getMyServiceProvider } from '../services/serviceProviderService';
import { getMyRequests, browseRequests, getMyPledges, getRecommendedRequests, getAvailableDeliveries, getMyClaimedDeliveries } from '../services/requestService';
import { listDocuments } from '../services/documentService';

function DashboardTile({ to, icon: Icon, children }) {
  return (
    <Link className="dashboard-tile" to={to}>
      <span className="dashboard-tile-icon"><Icon size={18} /></span>
      <span style={{ flex: 1 }}>{children}</span>
      <ArrowRight size={16} style={{ opacity: 0.4 }} />
    </Link>
  );
}

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

  const outcomeData = [
    { name: 'Pending', value: totalPending },
    { name: 'Approved', value: totalApproved },
    { name: 'Rejected', value: totalRejected }
  ];

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Pending Review" value={totalPending} accent="amber" icon={ClipboardList} />
        <StatCard label="Approved" value={totalApproved} accent="green" icon={CheckCircle2} />
        <StatCard label="Rejected" value={totalRejected} accent="red" icon={XCircle} />
        <StatCard label="Total Profiles" value={totalProfiles} accent="neutral" icon={Users} />
      </div>

      <div className="two-col-charts">
        <VerificationStatusChart stats={stats} />
        <RequestBreakdownChart data={outcomeData} title="Profiles by Outcome" centerLabel="Profiles" />
      </div>

      <div className="dashboard-actions">
        <DashboardTile to="/admin/verification" icon={ShieldCheck}>Go to Verification Queue</DashboardTile>
        <DashboardTile to="/requests" icon={PackageSearch}>View All Requests</DashboardTile>
        <DashboardTile to="/admin/users" icon={UserCog}>Manage Users</DashboardTile>
        <DashboardTile to="/admin/flagged" icon={Flag}>Flagged Content</DashboardTile>
        <DashboardTile to="/admin/reports" icon={BarChart3}>View Reports</DashboardTile>
      </div>
    </>
  );
}

/** Groups the fine-grained request lifecycle into 4 dashboard-friendly buckets. */
function summarizeRequestStatuses(requests) {
  const buckets = { Open: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
  for (const r of requests) {
    if (r.status === 'CREATED' || r.status === 'PLEDGED') buckets.Open++;
    else if (['ACCEPTED', 'IN_PROGRESS', 'DELIVERED'].includes(r.status)) buckets['In Progress']++;
    else if (r.status === 'COMPLETED') buckets.Completed++;
    else if (r.status === 'CANCELLED') buckets.Cancelled++;
  }
  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
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
  const breakdown = summarizeRequestStatuses(requests);

  return (
    <>
      <div className="stat-grid">
        <StatCard label={profile.homeName} value={profile.verificationStatus} accent={accent} subtitle="Verification status" icon={HomeIcon} />
        <StatCard label="Active Requests" value={activeCount} accent="amber" icon={ClipboardList} />
        <StatCard label="Completed Requests" value={completedCount} accent="green" icon={CheckCircle2} />
        <StatCard label="Documents Uploaded" value={docCount ?? '—'} accent="neutral" icon={FileText} />
      </div>

      {requests.length > 0 && (
        <RequestBreakdownChart data={breakdown} title="Your Requests by Status" centerLabel="Requests" />
      )}

      <div className="dashboard-actions">
        <DashboardTile to="/childrens-home" icon={HomeIcon}>View Profile & Documents</DashboardTile>
        {profile.verificationStatus === 'APPROVED' && (
          <DashboardTile to="/requests/new" icon={PlusCircle}>Create a New Request</DashboardTile>
        )}
        <DashboardTile to="/requests" icon={ListChecks}>View My Requests</DashboardTile>
        <DashboardTile to="/directory/donors" icon={Users}>Browse Donors</DashboardTile>
      </div>
    </>
  );
}

function ServiceProviderDashboard() {
  const [profile, setProfile] = useState(null);
  const [docCount, setDocCount] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyServiceProvider()
      .then(async (p) => {
        setProfile(p);
        const [docs, pledgesPage] = await Promise.all([
          listDocuments('SERVICE_PROVIDER', p.id).catch(() => []),
          getMyPledges().catch(() => ({ content: [] }))
        ]);
        setDocCount(docs.length);
        setPledges(pledgesPage.content || []);
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
  const breakdown = summarizeRequestStatuses(pledges);

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Verification Status" value={profile.verificationStatus} accent={accent} icon={ShieldCheck} />
        <StatCard
          label="Police Clearance"
          value={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'Verified' : 'Pending') : 'N/A'}
          accent={profile.policeClearanceRequired ? (profile.policeClearanceVerified ? 'green' : 'amber') : 'neutral'}
          icon={ShieldCheck}
        />
        <StatCard label="My Pledges" value={pledges.length} accent="neutral" icon={HeartHandshake} />
        <StatCard label="Documents Uploaded" value={docCount ?? '—'} accent="neutral" icon={FileText} />
      </div>

      {pledges.length > 0 && (
        <RequestBreakdownChart data={breakdown} title="Your Pledges by Status" centerLabel="Pledges" />
      )}

      <div className="dashboard-actions">
        <DashboardTile to="/service-provider" icon={ShieldCheck}>View Profile & Documents</DashboardTile>
        <DashboardTile to="/requests" icon={PackageSearch}>Browse Service Requests</DashboardTile>
      </div>
      <RecommendedRequests />
    </>
  );
}

function RecommendedRequests() {
  const [recommended, setRecommended] = useState(null);

  useEffect(() => {
    getRecommendedRequests().then(setRecommended).catch(() => setRecommended([]));
  }, []);

  if (recommended === null) return null;
  if (recommended.length === 0) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h2>Recommended For You</h2>
      <p className="hint-text">Based on categories you&apos;ve pledged to before, ranked by urgency.</p>
      <div className="request-list">
        {recommended.map((r) => (
          <Link key={r.id} to={`/requests/${r.id}`} className="request-row">
            <div className="request-row-main">
              <strong>{r.title}</strong>
              <div className="hint-text">{r.childrensHomeName}</div>
            </div>
            <span className={`urgency-pill urgency-${r.urgency.toLowerCase()}`}>{r.urgency}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DonorDashboard() {
  const [openCount, setOpenCount] = useState(null);
  const [pledges, setPledges] = useState([]);

  useEffect(() => {
    Promise.all([
      browseRequests('CREATED', { requestType: 'GOODS' }).catch(() => ({ content: [], totalElements: 0 })),
      getMyPledges().catch(() => ({ content: [] }))
    ]).then(([openPage, pledgesPage]) => {
      // totalElements (not content.length) — content is just the current page,
      // but the count should reflect the true total across all pages.
      setOpenCount(openPage.totalElements ?? (openPage.content || []).length);
      setPledges(pledgesPage.content || []);
    });
  }, []);

  const breakdown = summarizeRequestStatuses(pledges);

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Open Goods Requests" value={openCount ?? '—'} accent="amber" icon={Package} />
        <StatCard label="My Pledges" value={pledges.length} accent="green" icon={HeartHandshake} />
      </div>

      {pledges.length > 0 && (
        <RequestBreakdownChart data={breakdown} title="Your Pledges by Status" centerLabel="Pledges" />
      )}

      <div className="dashboard-actions">
        <DashboardTile to="/requests" icon={PackageSearch}>Browse Donation Requests</DashboardTile>
      </div>
      <RecommendedRequests />
    </>
  );
}

/**
 * Distinct from DonorDashboard: a Delivery Volunteer's meaningful numbers
 * are "how many deliveries need someone" and "how many have I claimed" —
 * not "open goods requests" (those are already pledged by the time a
 * volunteer pickup is needed) or "my pledges" (claiming sets a different
 * field, deliveryVolunteer, not pledgedBy — myPledges would always show 0
 * for a volunteer who has only ever claimed deliveries, never pledged
 * goods directly).
 */
function DeliveryVolunteerDashboard() {
  const [availableCount, setAvailableCount] = useState(null);
  const [claimed, setClaimed] = useState([]);

  useEffect(() => {
    Promise.all([
      getAvailableDeliveries(0).catch(() => ({ content: [], totalElements: 0 })),
      getMyClaimedDeliveries(0).catch(() => ({ content: [] }))
    ]).then(([availablePage, claimedPage]) => {
      setAvailableCount(availablePage.totalElements ?? (availablePage.content || []).length);
      setClaimed(claimedPage.content || []);
    });
  }, []);

  const breakdown = summarizeRequestStatuses(claimed);

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Available Deliveries" value={availableCount ?? '—'} accent="amber" icon={Truck} />
        <StatCard label="My Claimed Deliveries" value={claimed.length} accent="green" icon={HeartHandshake} />
      </div>

      {claimed.length > 0 && (
        <RequestBreakdownChart data={breakdown} title="Your Claimed Deliveries by Status" centerLabel="Deliveries" />
      )}

      <div className="dashboard-actions">
        <DashboardTile to="/deliveries/available" icon={Truck}>Browse Available Deliveries</DashboardTile>
        <DashboardTile to="/requests" icon={PackageSearch}>Browse Donation Requests</DashboardTile>
      </div>
      <RecommendedRequests />
    </>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  return (
    <div className="page page-wide">
      <div className="dashboard-banner">
        <HeroNetwork className="dashboard-banner-network" />
        <h1>Welcome back, {user?.username}</h1>
        <p>{user?.roles?.join(', ')}</p>
      </div>

      {hasRole('ADMINISTRATOR') && <AdminDashboard />}
      {hasRole('CHILDRENS_HOME') && <ChildrensHomeDashboard />}
      {hasRole('SERVICE_PROVIDER') && <ServiceProviderDashboard />}
      {hasRole('DONOR') && <DonorDashboard />}
      {hasRole('DELIVERY_VOLUNTEER') && <DeliveryVolunteerDashboard />}
    </div>
  );
}
