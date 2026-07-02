import React from 'react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="page">
      <h1>403 — Not authorized</h1>
      <p>You don&apos;t have permission to view this page.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
