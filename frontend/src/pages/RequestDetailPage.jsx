import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRequest, getRequestHistory, changeRequestStatus, arrangeAlternativeDelivery } from '../services/requestService';
import { listDocuments, downloadDocument, removeOwnDocument } from '../services/documentService';
import { flagRequest, removeDocument } from '../services/moderationService';
import { listMessages, sendMessage } from '../services/messageService';
import RequestStatusBadge from '../components/RequestStatusBadge.jsx';
import DocumentUploadWidget from '../components/DocumentUploadWidget.jsx';
import RatingWidget from '../components/RatingWidget.jsx';
import ReputationBadge from '../components/ReputationBadge.jsx';
import { useModal } from '../hooks/useModal';

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
        actions.push({ label: 'Pledge to Fulfil', status: 'PLEDGED', needsDelivery: request.requestType === 'GOODS' });
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

function RequestImageGallery({ requestId, isAdmin, isOwner, requestStatus, onModal }) {
  const [images, setImages] = useState(null);
  const canOwnerRemove = isOwner && requestStatus === 'CREATED';

  const load = () => {
    listDocuments('REQUEST', requestId).then(setImages).catch(() => setImages([]));
  };

  useEffect(load, [requestId]);

  const handleRemove = async (doc) => {
    const ok = await onModal.confirmDialog({
      title: `Remove "${doc.originalFileName}"?`,
      message: 'This only removes the image, not the request itself.',
      danger: true
    });
    if (!ok) return;
    try {
      if (isAdmin) {
        await removeDocument(doc.id);
      } else {
        await removeOwnDocument(doc.id);
      }
      load();
    } catch (err) {
      await onModal.alertDialog({ title: 'Failed to remove', message: err.response?.data?.message || 'Please try again.' });
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
            {(isAdmin || canOwnerRemove) && (
              <button type="button" className="btn-danger" onClick={() => handleRemove(doc)}>Remove</button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MessagesPanel({ requestId, currentUsername }) {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    listMessages(requestId).then(setMessages).catch(() => setMessages([]));
  };

  useEffect(load, [requestId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(requestId, draft.trim());
      setDraft('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messages-panel">
      <h3>Messages</h3>
      <p className="hint-text">Coordinate directly about this request — visible only to the two of you.</p>

      <div className="messages-list">
        {messages === null ? (
          <p className="hint-text">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="hint-text">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={'message-bubble' + (m.senderUsername === currentUsername ? ' message-bubble-own' : '')}>
              <div className="message-bubble-meta">{m.senderUsername} · {new Date(m.createdDate).toLocaleString()}</div>
              <div>{m.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="messages-compose">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !draft.trim()}>Send</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const modal = useModal();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingDeliveryAction, setPendingDeliveryAction] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('SELF_DELIVERY');
  const [courierDetails, setCourierDetails] = useState('');

  const isAdmin = hasRole('ADMINISTRATOR');
  const isOwningHome = hasRole('CHILDRENS_HOME');

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
      setDeliveryMethod('SELF_DELIVERY');
      setCourierDetails('');
      setPendingDeliveryAction(action);
      return;
    }
    let remarks = null;
    if (action.needsReason) {
      remarks = await modal.promptDialog({
        title: action.label + '?',
        placeholder: 'Reason',
        confirmLabel: action.label,
        danger: action.danger,
        required: true
      });
      if (!remarks) return;
    }
    setActionLoading(true);
    try {
      await changeRequestStatus(id, action.status, remarks);
      load();
    } catch (err) {
      await modal.alertDialog({ title: 'Action failed', message: err.response?.data?.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const detailsToSend = pendingDeliveryAction.status === 'PLEDGED' ? null : courierDetails;
      await changeRequestStatus(id, pendingDeliveryAction.status, null, deliveryMethod, detailsToSend);
      setPendingDeliveryAction(null);
      setCourierDetails('');
      load();
    } catch (err) {
      await modal.alertDialog({ title: 'Action failed', message: err.response?.data?.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrangeAlternativeDelivery = async () => {
    const courierInfo = await modal.promptDialog({
      title: 'Arrange alternative delivery',
      message: 'The volunteer pickup hasn\'t progressed. Describe the alternative arrangement (e.g. courier company and tracking number).',
      placeholder: 'e.g. Pronto Courier, tracking #12345',
      confirmLabel: 'Arrange',
      required: true
    });
    if (!courierInfo) return;
    setActionLoading(true);
    try {
      await arrangeAlternativeDelivery(id, courierInfo);
      load();
    } catch (err) {
      await modal.alertDialog({ title: 'Failed to arrange delivery', message: err.response?.data?.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFlag = async () => {
    try {
      if (!request.flagged) {
        const reason = await modal.promptDialog({
          title: 'Flag this request?',
          message: 'It will be hidden from the public marketplace until cleared.',
          placeholder: 'Reason for flagging',
          confirmLabel: 'Flag',
          danger: true,
          required: true
        });
        if (!reason) return;
        await flagRequest(request.id, true, reason);
      } else {
        const ok = await modal.confirmDialog({ title: 'Clear the flag on this request?' });
        if (!ok) return;
        await flagRequest(request.id, false, null);
      }
      load();
    } catch (err) {
      await modal.alertDialog({ title: 'Failed to update flag', message: err.response?.data?.message || 'Please try again.' });
    }
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
        {isOwningHome && request.deliveryMethod === 'VOLUNTEER_PICKUP'
          && !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(request.status) && (
          <div style={{ marginTop: '0.5rem' }}>
            <p className="hint-text">
              A delivery volunteer was requested for this pledge. If it's been about a week with no progress,
              you can arrange your own alternative (e.g. a courier) instead.
            </p>
            <button type="button" onClick={handleArrangeAlternativeDelivery} disabled={actionLoading}>
              Arrange Alternative Delivery
            </button>
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
            {actions.map((a) => {
              const needsVerification = a.status === 'PLEDGED' && !user?.emailVerified;
              return (
                <button
                  key={a.status}
                  className={a.danger ? 'btn-danger' : ''}
                  disabled={actionLoading || needsVerification}
                  title={needsVerification ? 'Verify your email address first — see the banner above' : undefined}
                  onClick={() => handleAction(a)}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        )}
        {actions.some((a) => a.status === 'PLEDGED') && !user?.emailVerified && (
          <p className="form-error" style={{ marginTop: '0.5rem' }}>
            Verify your email address before pledging — use the "Resend email" button in the banner above.
          </p>
        )}

        {pendingDeliveryAction && pendingDeliveryAction.status === 'PLEDGED' ? (
          <form onSubmit={handleDeliverySubmit} className="stacked-form" style={{ marginTop: '1rem' }}>
            <p className="hint-text" style={{ marginTop: 0 }}>
              How will this donation reach the home?
            </p>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="pledgeDeliveryChoice"
                  value="SELF_DELIVERY"
                  checked={deliveryMethod === 'SELF_DELIVERY'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                I'll deliver it myself
              </span>
            </label>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="pledgeDeliveryChoice"
                  value="VOLUNTEER_PICKUP"
                  checked={deliveryMethod === 'VOLUNTEER_PICKUP'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                I need a delivery volunteer to pick it up
              </span>
            </label>
            <p className="hint-text">
              If you request a volunteer and nothing progresses within about a week, the home will be notified
              and can arrange an alternative — your pledge stays credited to you either way.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Saving…' : 'Confirm Pledge'}
              </button>
              <button type="button" onClick={() => setPendingDeliveryAction(null)}>Cancel</button>
            </div>
          </form>
        ) : pendingDeliveryAction && (
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
          <RequestImageGallery
            requestId={request.id}
            isAdmin={isAdmin}
            isOwner={hasRole('CHILDRENS_HOME')}
            requestStatus={request.status}
            onModal={modal}
          />
        )}
      </div>

      {request.status === 'COMPLETED' && (
        <RatingWidget
          requestId={request.id}
          canRate={hasRole('CHILDRENS_HOME')}
          pledgedByUsername={request.pledgedByUsername}
        />
      )}

      {!['CREATED', 'PLEDGED'].includes(request.status)
        && (isOwningHome || request.pledgedByUsername === user?.username || isAdmin) && (
        <MessagesPanel requestId={request.id} currentUsername={user?.username} />
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
