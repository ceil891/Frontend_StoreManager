import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated } from '@/features/auth/store/authStore';

export function PrivateRoute() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the intended URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
