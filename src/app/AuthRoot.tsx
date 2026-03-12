import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthProvider, useAuth } from '../store/authStore';
import { getAccessToken } from '../services/tokenStorage';

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
 * Auth guard: allows access only when accessToken exists. Redirects to /login otherwise.
 * If token exists, children render immediately (session persists across refresh).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const token = getAccessToken();

  if (token || isAuthenticated) {
    return <>{children}</>;
  }
  if (loading) {
    return null;
  }
  return <Navigate to="/login" state={{ from: location }} replace />;
}
