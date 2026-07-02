import React from 'react';
import { Menu } from 'lucide-react';

export default function TopBar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <span className="topbar-brand-mobile">Helping Hands</span>
    </header>
  );
}
