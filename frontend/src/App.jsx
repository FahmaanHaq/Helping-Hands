import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/Layout/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import ChildrensHomeRegisterPage from './pages/ChildrensHomeRegisterPage.jsx';
import ServiceProviderRegisterPage from './pages/ServiceProviderRegisterPage.jsx';
import AdminVerificationPage from './pages/AdminVerificationPage.jsx';
import CreateRequestPage from './pages/CreateRequestPage.jsx';
import RequestsListPage from './pages/RequestsListPage.jsx';
import RequestDetailPage from './pages/RequestDetailPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

// Authenticated pages get the sidebar shell; public pages (login/register) don't.
function Shell({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Shell><DashboardPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/childrens-home"
        element={
          <ProtectedRoute allowedRoles={['CHILDRENS_HOME']}>
            <Shell><ChildrensHomeRegisterPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/service-provider"
        element={
          <ProtectedRoute allowedRoles={['SERVICE_PROVIDER']}>
            <Shell><ServiceProviderRegisterPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <Shell><RequestsListPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/new"
        element={
          <ProtectedRoute allowedRoles={['CHILDRENS_HOME']}>
            <Shell><CreateRequestPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <Shell><RequestDetailPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/verification"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
            <Shell><AdminVerificationPage /></Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
