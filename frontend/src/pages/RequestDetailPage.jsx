import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRequest, getRequestHistory, changeRequestStatus } from '../services/requestService';
import { listDocuments, downloadDocument } from '../services/documentService';
import { flagRequest, removeDocument } from '../services/moderationService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';
import DocumentUploadWidget from '../components/DocumentUploadWidget.jsx';
import RatingWidget from '../components/RatingWidget.jsx';
import ReputationBadge from '../components/ReputationBadge.jsx';

function getAvailableActions(request, user, hasRole) {
  const actions = [];
  const isOwningHome = hasRole('CHILDRENS_HOME'); // ownership itself is enforced server-side; this just decides what to *show*
  const isPledgedUser = request.pledgedByUsername === user?.username;
  const isDonor = hasRole('DONOR') || hasRole('DELIVERY_VOLUNTEER');
  const isProvider = hasRole('SERVICE_PROVIDER');
  const isAdmin = hasRole('ADMINISTRATOR');

  switch (request.status) {
    case 'CREATED':
      if ((request.requestType === 'GOODS' && isDonor) || (request.requestType === 'SERVICE' && isProvider)) {
        actions.push({ label: 'Pledge to Fulfil', status: 'PLEDGED' });
      }
      if (isOwningHome || isAdmin) {
        actions.push({ label: 'Cancel Request', status: 'CANCELLED', danger: true, needsReason: true });
      }
      break;
    case 'PLEDGED':
      if (isOwningHome || isAdmin) {
        actions.push({ label: 'Accept Pledge', status: 'ACCEPTED' });
        actions.push({ label: 'Cancel Request', status: 'CANCELLED', danger: true, needsReason: true });
      }
      break;
    case 'ACCEPTED':
      if (isPledgedUser || isOwningHome || isAdmin) {
        actions.push({ label: 'Mark In Progress', status: 'IN_PROGRESS', needsDelivery: request.requestType === 'GOODS' });
      }
      break;
    case 'IN_PROGRESS':
      if (isPledgedUser || isAdmin) {
        actions.push({ label: 'Mark Delivered', status: 'DELIVERED', needsDelivery: request.requestType === 'GOODS' });
      }
      break;
    case 'DELIVERED':
      if (isOwningHome || isAdmin) {
        actions.push({ label: 'Confirm Completion', status: 'COMPLETED' });
      }
      break;
    default:
      break;
  }
  return actions;
}

function RequestImageGallery({ requestId, isAdmin }) {
  const [images, setImages] = useState(null);

  const load = () => {
    listDocuments('REQUEST', requestId).then(setImages).catch(() => setImages([]));
  };

  useEffect(load, [requestId]);

  const handleRemove = async (doc) => {
    if (!window.confirm(`Remove "${doc.originalFileName}"? This only removes the image, not the request.`)) return;
    try {
      await removeDocument(doc.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (images === null) return <p className="hint-text">Loading images…</p>;
  if (images.length === 0) return <p className="hint-text">No images attached.</p>;

  return (
    <ul className="document-list">
      {images.map((doc) => (
        <li key={doc.id}>
          <span>{doc.originalFileName}</span>
          <span style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={() => downloadDocument(doc.id, doc.originalFileName)}>Download</button>
            {isAdmin && (
              <button type="button" className="btn-danger" onClick={() => handleRemove(doc)}>Remove</button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingDeliveryAction, setPendingDeliveryAction] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('SELF_DELIVERY');
  const [courierDetails, setCourierDetails] = useState('');

  const isAdmin = hasRole('ADMINISTRATOR');

  const load = async () => {
    setLoading(true);
    try {
      const [req, hist] = await Promise.all([getRequest(id), getRequestHistory(id)]);
      setRequest(req);
      setHistory(hist);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action) => {
    if (action.needsDelivery) {
      setPendingDeliveryAction(action);
      return;
    }
    let remarks = null;
    if (action.needsReason) {
      remarks = window.prompt('Reason:');
      if (!remarks) return;
    }
    setActionLoading(true);
    try {
      await changeRequestStatus(id, action.status, remarks);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await changeRequestStatus(id, pendingDeliveryAction.status, null, deliveryMethod, courierDetails);
      setPendingDeliveryAction(null);
      setCourierDetails('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFlag = async () => {
    if (!request.flagged) {
      const reason = window.prompt('Reason for flagging this request:');
      if (!reason) return;
      await flagRequest(request.id, true, reason);
    } else {
      if (!window.confirm('Clear the flag on this request?')) return;
      await flagRequest(request.id, false, null);
    }
    load();
  };

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!request) return null;

  const categoryLabel = request.requestType === 'GOODS' ? request.goodsCategory : request.serviceCategory;
  const actions = getAvailableActions(request, user, hasRole);
  const canUploadImages = hasRole('CHILDRENS_HOME') && request.status === 'CREATED';

  return (
    <div className="page">
      <button className="link-button" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>

      <div className="profile-card">
        <div className="profile-row">
          <span>Status</span>
          <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <RequestStatusBadge status={request.status} />
            {request.flagged && <span className="flagged-pill">Flagged</span>}
          </span>
        </div>
        <div className="profile-row"><span>Title</span><strong>{request.title}</strong></div>
        <div className="profile-row"><span>Home</span><strong>{request.childrensHomeName}</strong></div>
        <div className="profile-row"><span>Type</span><strong>{request.requestType} · {categoryLabel?.replace('_', ' ')}</strong></div>
        {request.quantity && <div className="profile-row"><span>Quantity</span><strong>{request.quantity}</strong></div>}
        <div className="profile-row"><span>Urgency</span><strong>{request.urgency}</strong></div>
        {request.description && <div className="profile-row"><span>Description</span><strong>{request.description}</strong></div>}
        {request.pledgedByUsername && (
          <div className="profile-row">
            <span>Pledged By</span>
            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <strong>{request.pledgedByUsername}</strong>
              <ReputationBadge userId={request.pledgedByUserId} />
            </span>
          </div>
        )}
        {request.deliveryMethod && (
          <div className="profile-row">
            <span>Delivery Method</span>
            <strong>
              {request.deliveryMethod.replace('_', ' ')}
              {request.courierDetails ? ` — ${request.courierDetails}` : ''}
            </strong>
          </div>
        )}
        {request.status === 'CANCELLED' && request.cancellationReason && (
          <p className="form-error">Cancelled: {request.cancellationReason}</p>
        )}
        {request.flagged && request.flagReason && (
          <p className="form-error">Flagged: {request.flagReason}</p>
        )}

        {actions.length > 0 && (
          <div className="verification-actions" style={{ marginTop: '0.5rem' }}>
            {actions.map((a) => (
              <button
                key={a.status}
                className={a.danger ? 'btn-danger' : ''}
                disabled={actionLoading}
                onClick={() => handleAction(a)}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {pendingDeliveryAction && (
          <form onSubmit={handleDeliverySubmit} className="stacked-form" style={{ marginTop: '1rem' }}>
            <label>
              Delivery Method
              <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                <option value="SELF_DELIVERY">Self Delivery</option>
                <option value="VOLUNTEER_PICKUP">Volunteer Pickup</option>
                <option value="COURIER">Courier</option>
              </select>
            </label>
            <label>
              Courier / Tracking Details (optional)
              <input value={courierDetails} onChange={(e) => setCourierDetails(e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Saving…' : `Confirm: ${pendingDeliveryAction.label}`}
              </button>
              <button type="button" onClick={() => setPendingDeliveryAction(null)}>Cancel</button>
            </div>
          </form>
        )}

        {isAdmin && (
          <button
            type="button"
            className={request.flagged ? '' : 'btn-danger'}
            style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleToggleFlag}
          >
            <Flag size={14} /> {request.flagged ? 'Clear Flag' : 'Flag as Inappropriate'}
          </button>
        )}
      </div>

      <div className="document-widget">
        <h3>Request Images</h3>
        {canUploadImages ? (
          <DocumentUploadWidget ownerType="REQUEST" ownerId={request.id} allowedTypes={['REQUEST_IMAGE']} />
        ) : (
          <RequestImageGallery requestId={request.id} isAdmin={isAdmin} />
        )}
      </div>

      {request.status === 'COMPLETED' && (
        <RatingWidget
          requestId={request.id}
          canRate={hasRole('CHILDRENS_HOME')}
          pledgedByUsername={request.pledgedByUsername}
        />
      )}

      <div className="status-timeline">
        <h3>Status History</h3>
        {history.map((h, i) => (
          <div key={i} className="status-timeline-item">
            <RequestStatusBadge status={h.toStatus} />
            <span className="hint-text">
              {h.changedBy} · {new Date(h.changedDate).toLocaleString()}
              {h.remarks ? ` · ${h.remarks}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
