import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wrap any page element that requires authentication.
 * Pass `allowedRoles` (e.g. ["ADMINISTRATOR"]) to further restrict by role.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.some((role) => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
