import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import EmailVerificationBanner from '../EmailVerificationBanner.jsx';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell-main">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <EmailVerificationBanner />
        <div className="app-shell-content">{children}</div>
      </div>
    </div>
  );
}
