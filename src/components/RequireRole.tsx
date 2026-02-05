/**
 * RequireRole Component
 * Wrapper that restricts content based on user roles
 */
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { ShieldX } from 'lucide-react';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  /** If true, render nothing instead of forbidden message */
  silent?: boolean;
  /** Custom fallback component */
  fallback?: ReactNode;
}

/**
 * Wraps content that should only be visible to certain roles
 */
export function RequireRole({ allowedRoles, children, silent = false, fallback }: RequireRoleProps) {
  const { user } = useAuth();

  // No user = not authenticated
  if (!user) {
    return silent ? null : (fallback ?? <ForbiddenMessage />);
  }

  // Check if user's role is in allowed list
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return silent ? null : (fallback ?? <ForbiddenMessage />);
  }

  return <>{children}</>;
}

/**
 * Default forbidden message component
 */
function ForbiddenMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 text-center max-w-md">
        You don't have permission to view this content. Contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Hook to check specific permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  return {
    canManageUsers: user?.role === 'admin',
    canManageAgents: user?.role === 'admin' || user?.role === 'operator',
    canViewAgents: true, // All authenticated users can view
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator',
    isViewer: user?.role === 'viewer',
  };
}
