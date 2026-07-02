import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <p>Welcome, <strong>{user?.username}</strong>.</p>
      <p>Roles: {user?.roles?.join(', ')}</p>

      <section className="dashboard-actions">
        {hasRole('CHILDRENS_HOME') && (
          <Link className="dashboard-tile" to="/childrens-home">
            Children&apos;s Home Profile & Verification Status
          </Link>
        )}

        {hasRole('SERVICE_PROVIDER') && (
          <Link className="dashboard-tile" to="/service-provider">
            Service Provider Profile & Verification Status
          </Link>
        )}

        {hasRole('DONOR') && (
          <div className="dashboard-tile dashboard-tile-disabled">
            Donation Requests — coming in a later module
          </div>
        )}

        {hasRole('ADMINISTRATOR') && (
          <Link className="dashboard-tile" to="/admin/verification">
            Verification Queue (Homes & Providers)
          </Link>
        )}
      </section>
    </div>
  );
}
