import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import ChildrensHomeRegisterPage from './pages/ChildrensHomeRegisterPage.jsx';
import ServiceProviderRegisterPage from './pages/ServiceProviderRegisterPage.jsx';
import AdminVerificationPage from './pages/AdminVerificationPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/childrens-home"
            element={
              <ProtectedRoute allowedRoles={['CHILDRENS_HOME']}>
                <ChildrensHomeRegisterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/service-provider"
            element={
              <ProtectedRoute allowedRoles={['SERVICE_PROVIDER']}>
                <ServiceProviderRegisterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <AdminVerificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <div className="page">Admin area placeholder</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
