import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Flag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { browseRequests, getMyRequests, getMyPledges } from '../services/requestService';
import { flagRequest } from '../services/moderationService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { useModal } from '../hooks/useModal';

const STATUS_OPTIONS = ['CREATED', 'PLEDGED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
const GOODS_CATEGORIES = ['FOOD', 'BOOKS', 'CLOTHING', 'MEDICAL_SUPPLIES', 'EDUCATIONAL_MATERIALS', 'OTHER_GOODS'];
const SERVICE_CATEGORIES = ['TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'];
const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function RequestRow({ request, isAdmin, onToggleFlag }) {
  const categoryLabel = request.requestType === 'GOODS' ? request.goodsCategory : request.serviceCategory;
  return (
    <div className="request-row">
      <Link to={`/requests/${request.id}`} className="request-row-main" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
        <strong>{request.title}</strong>
        <div className="hint-text">
          {request.childrensHomeName} · {request.requestType} · {categoryLabel?.replace('_', ' ')}
          {request.requestType === 'GOODS' && request.quantity ? ` · Qty ${request.quantity}` : ''}
        </div>
      </Link>
      <div className="request-row-meta">
        <span className={`urgency-pill urgency-${request.urgency.toLowerCase()}`}>{request.urgency}</span>
        <RequestStatusBadge status={request.status} />
        {request.flagged && <span className="flagged-pill">Flagged</span>}
        {isAdmin && (
          <button
            type="button"
            className="icon-button"
            title={request.flagged ? 'Clear flag' : 'Flag as inappropriate'}
            onClick={(e) => { e.preventDefault(); onToggleFlag(request); }}
          >
            <Flag size={16} fill={request.flagged ? '#b3261e' : 'none'} color="#b3261e" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RequestsListPage() {
  const { hasRole } = useAuth();
  const { promptDialog, confirmDialog, alertDialog } = useModal();
  const isHome = hasRole('CHILDRENS_HOME');
  const isDonor = hasRole('DONOR');
  const isDeliveryVolunteer = hasRole('DELIVERY_VOLUNTEER');
  const isProvider = hasRole('SERVICE_PROVIDER');
  const isGoodsRole = isDonor || isDeliveryVolunteer;
  const isMarketplaceRole = isGoodsRole || isProvider;
  const isAdmin = hasRole('ADMINISTRATOR');

  const [mainPage, setMainPage] = useState(null);   // Page<RequestResponse> for the primary list
  const [pledgesPage, setPledgesPage] = useState(null);
  const [pageNum, setPageNum] = useState(0);
  const [pledgesPageNum, setPledgesPageNum] = useState(0);
  const [adminStatus, setAdminStatus] = useState('CREATED');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryOptions = isGoodsRole ? GOODS_CATEGORIES : SERVICE_CATEGORIES;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isHome) {
        setMainPage(await getMyRequests(pageNum));
      } else if (isAdmin) {
        setMainPage(await browseRequests(adminStatus, {}, pageNum));
      } else if (isMarketplaceRole) {
        const filters = {
          requestType: isGoodsRole ? 'GOODS' : 'SERVICE',
          ...(isGoodsRole && category ? { goodsCategory: category } : {}),
          ...(isProvider && category ? { serviceCategory: category } : {}),
          ...(urgency ? { urgency } : {})
        };
        const [openPage, myPledgesPage] = await Promise.all([
          browseRequests('CREATED', filters, pageNum),
          getMyPledges(pledgesPageNum)
        ]);
        setMainPage(openPage);
        setPledgesPage(myPledgesPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 0 whenever a filter changes (a stale page number combined
  // with a narrower filter could otherwise land past the new last page).
  useEffect(() => { setPageNum(0); }, [adminStatus, category, urgency]);

  useEffect(() => { load(); }, [adminStatus, category, urgency, pageNum, pledgesPageNum]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFlag = async (request) => {
    try {
      if (!request.flagged) {
        const reason = await promptDialog({
          title: 'Flag this request?',
          message: 'It will be hidden from the public marketplace until an admin clears the flag.',
          placeholder: 'Reason for flagging',
          confirmLabel: 'Flag',
          danger: true,
          required: true
        });
        if (!reason) return;
        await flagRequest(request.id, true, reason);
      } else {
        const ok = await confirmDialog({ title: 'Clear the flag on this request?' });
        if (!ok) return;
        await flagRequest(request.id, false, null);
      }
      load();
    } catch (err) {
      await alertDialog({ title: 'Failed to update flag', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  const requests = mainPage?.content || [];
  const pledges = pledgesPage?.content || [];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <h1>{isHome ? 'My Requests' : isAdmin ? 'All Requests' : 'Open Requests'}</h1>
        {isHome && (
          <Link className="btn-primary" to="/requests/new">
            <Plus size={16} /> New Request
          </Link>
        )}
      </header>

      {isAdmin && (
        <label className="inline-filter">
          Filter by status
          <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}

      {isMarketplaceRole && (
        <div className="inline-filter" style={{ gap: '1rem' }}>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label>
            Urgency
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="">All</option>
              {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="hint-text">
          {isHome ? "You haven't created any requests yet." : 'Nothing matches these filters right now.'}
        </p>
      ) : (
        <>
          <div className="request-list">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} isAdmin={isAdmin} onToggleFlag={handleToggleFlag} />
            ))}
          </div>
          <Pagination pageData={mainPage} onPageChange={setPageNum} />
        </>
      )}

      {isMarketplaceRole && (
        <>
          <h2 style={{ marginTop: '2rem' }}>My Pledges</h2>
          {pledges.length === 0 ? (
            <p className="hint-text">You haven&apos;t pledged to any requests yet.</p>
          ) : (
            <>
              <div className="request-list">
                {pledges.map((r) => <RequestRow key={r.id} request={r} isAdmin={false} />)}
              </div>
              <Pagination pageData={pledgesPage} onPageChange={setPledgesPageNum} />
            </>
          )}
        </>
      )}
    </div>
  );
}
