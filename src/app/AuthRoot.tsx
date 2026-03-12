import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthProvider, useAuth } from '../store/authStore';

/**
 * Wraps all routes with AuthProvider so auth state and useNavigate are available.
 */
export function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/**
 * Protects routes: redirects to /login if not authenticated. No UI change; only logic.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
