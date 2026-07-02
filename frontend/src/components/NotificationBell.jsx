import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';

const POLL_INTERVAL_MS = 30000; // No websockets in this build — polling is the honest, simple choice at this scale.

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const refreshCount = () => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const page = await listNotifications(0);
        setNotifications(page.content || []);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClickNotification = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      refreshCount();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button className="notification-bell-btn" onClick={handleToggle} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="link-button" onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>

          {loading ? (
            <p className="hint-text" style={{ padding: '1rem' }}>Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="hint-text" style={{ padding: '1rem' }}>No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={'notification-item' + (n.read ? '' : ' notification-item-unread')}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="notification-item-title">{n.title}</div>
                  <div className="notification-item-message">{n.message}</div>
                  <div className="notification-item-date">{new Date(n.createdDate).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
