import React, { useEffect, useState } from 'react';
import { listUsers, suspendUser, reinstateUser } from '../services/userAdminService';
import Pagination from '../components/Pagination.jsx';
import { useModal } from '../hooks/useModal';

export default function AdminUsersPage() {
  const { promptDialog, confirmDialog, alertDialog } = useModal();
  const [search, setSearch] = useState('');
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (pageOverride) => {
    setLoading(true);
    setError(null);
    try {
      setPageData(await listUsers(search || undefined, pageOverride ?? page));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    load(0); // pass explicitly — setPage(0) hasn't taken effect in this closure yet
  };

  const handleSuspend = async (user) => {
    const reason = await promptDialog({
      title: `Suspend ${user.username}?`,
      message: 'This immediately logs them out and blocks further access. Provide a reason — it will be shown to the user.',
      placeholder: 'Reason for suspension',
      confirmLabel: 'Suspend',
      danger: true,
      required: true
    });
    if (!reason) return;
    try {
      await suspendUser(user.id, reason);
      load();
    } catch (err) {
      await alertDialog({ title: 'Failed to suspend user', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  const handleReinstate = async (user) => {
    const ok = await confirmDialog({ title: `Reinstate ${user.username}?`, message: 'They will be able to log in again immediately.' });
    if (!ok) return;
    try {
      await reinstateUser(user.id);
      load();
    } catch (err) {
      await alertDialog({ title: 'Failed to reinstate user', message: err.response?.data?.message || 'Please try again.' });
    }
  };

  const users = pageData?.content || [];

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
        <>
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
                  ) : u.roles.includes('ADMINISTRATOR') ? (
                    <span className="hint-text">Admin accounts can't be suspended here</span>
                  ) : (
                    <button className="btn-danger" onClick={() => handleSuspend(u)}>Suspend</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination pageData={pageData} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
