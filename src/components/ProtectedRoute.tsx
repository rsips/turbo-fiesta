/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional: Required roles to access this route */
  allowedRoles?: Array<'admin' | 'operator' | 'viewer'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-tkh-blue-dark flex flex-col items-center justify-center gap-4">
        <Activity className="w-12 h-12 text-tkh-primary animate-pulse" />
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-tkh-grey">Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-white border border-tkh-line p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-tkh-blue mb-4">Access Denied</h2>
          <p className="text-tkh-grey mb-6">
            You don't have permission to access this page. 
            Your current role is <span className="font-bold text-tkh-blue">{user.role}</span>.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-tkh-primary text-tkh-blue-dark font-bold hover:bg-tkh-primary/90 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
