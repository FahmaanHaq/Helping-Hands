import React, { useEffect, useState } from 'react';
import { listUsers, suspendUser, reinstateUser } from '../services/userAdminService';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listUsers(search || undefined);
      setUsers(page.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleSuspend = async (user) => {
    const reason = window.prompt(`Reason for suspending ${user.username}:`);
    if (!reason) return;
    try {
      await suspendUser(user.id, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleReinstate = async (user) => {
    if (!window.confirm(`Reinstate ${user.username}?`)) return;
    try {
      await reinstateUser(user.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reinstate user');
    }
  };

  return (
    <div className="page page-wide">
      <h1>User Management</h1>

      <form onSubmit={handleSearch} className="inline-filter" style={{ marginBottom: '1.5rem' }}>
        <input
          placeholder="Search by username, email, or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--hh-border)', borderRadius: '6px', minWidth: '260px' }}
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : users.length === 0 ? (
        <p className="hint-text">No users found.</p>
      ) : (
        <div className="request-list">
          {users.map((u) => (
            <div key={u.id} className="verification-card">
              <div>
                <strong>{u.fullName}</strong> · {u.username} · {u.email}
                <div className="hint-text">
                  {u.roles.join(', ')} · Joined {new Date(u.createdDate).toLocaleDateString()}
                </div>
                {u.accountLocked && (
                  <div className="form-error">Suspended: {u.suspensionReason}</div>
                )}
              </div>
              <div className="verification-actions">
                {u.accountLocked ? (
                  <button onClick={() => handleReinstate(u)}>Reinstate</button>
                ) : (
                  <button className="btn-danger" onClick={() => handleSuspend(u)}>Suspend</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
