import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Home, HardHat, ShieldCheck, PackageSearch, LogOut, X,
  Users, ScrollText, BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logomark from '../Logomark.jsx';

export default function Sidebar({ open, onClose }) {
  const { user, logout, hasRole } = useAuth();

  const linkClass = ({ isActive }) => 'sidebar-link' + (isActive ? ' sidebar-link-active' : '');

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={'sidebar' + (open ? ' sidebar-open' : '')}>
        <div className="sidebar-brand">
          <Logomark />
          <span>Helping Hands</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={linkClass} onClick={onClose} end>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {hasRole('CHILDRENS_HOME') && (
            <NavLink to="/childrens-home" className={linkClass} onClick={onClose}>
              <Home size={18} />
              <span>My Home Profile</span>
            </NavLink>
          )}

          {hasRole('SERVICE_PROVIDER') && (
            <NavLink to="/service-provider" className={linkClass} onClick={onClose}>
              <HardHat size={18} />
              <span>My Provider Profile</span>
            </NavLink>
          )}

          {hasRole('DONOR') && (
            <NavLink to="/requests" className={linkClass} onClick={onClose}>
              <PackageSearch size={18} />
              <span>Donation Requests</span>
            </NavLink>
          )}

          {hasRole('CHILDRENS_HOME') && (
            <NavLink to="/requests" className={linkClass} onClick={onClose}>
              <PackageSearch size={18} />
              <span>My Requests</span>
            </NavLink>
          )}

          {hasRole('SERVICE_PROVIDER') && (
            <NavLink to="/requests" className={linkClass} onClick={onClose}>
              <PackageSearch size={18} />
              <span>Service Requests</span>
            </NavLink>
          )}

          {hasRole('ADMINISTRATOR') && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <NavLink to="/admin/verification" className={linkClass} onClick={onClose}>
                <ShieldCheck size={18} />
                <span>Verification Queue</span>
              </NavLink>
              <NavLink to="/requests" className={linkClass} onClick={onClose}>
                <PackageSearch size={18} />
                <span>All Requests</span>
              </NavLink>
              <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                <Users size={18} />
                <span>User Management</span>
              </NavLink>
              <NavLink to="/admin/reports" className={linkClass} onClick={onClose}>
                <BarChart3 size={18} />
                <span>Reports</span>
              </NavLink>
              <NavLink to="/admin/audit-log" className={linkClass} onClick={onClose}>
                <ScrollText size={18} />
                <span>Audit Log</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="sidebar-username">{user?.username}</div>
              <div className="sidebar-role">{user?.roles?.[0]?.replace('ROLE_', '')}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
