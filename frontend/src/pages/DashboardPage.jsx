import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <p>Welcome, <strong>{user?.username}</strong>.</p>
      <p>Roles: {user?.roles?.join(', ')}</p>

      <section>
        <p>
          This is a scaffold landing point. Each role's real dashboard
          (Donor / Service Provider / Children&apos;s Home / Administrator)
          will be built as its own module on top of this skeleton.
        </p>
      </section>
    </div>
  );
}
