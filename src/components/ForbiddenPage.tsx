/**
 * Access Denied Page Component 🚫
 * Security will escort you back to your desk
 * Displayed when user doesn't have permission to access a resource
 */
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from './RoleBadge';

interface ForbiddenPageProps {
  /** Custom message to display */
  message?: string;
  /** Required roles for the resource */
  requiredRoles?: string[];
}

export function ForbiddenPage({ 
  message = "You don't have permission to access this page.",
  requiredRoles 
}: ForbiddenPageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied 🚫</h1>
        <p className="text-lg text-red-600 font-medium mb-4">Your badge doesn't work here</p>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Current Role Info */}
        {user && (
          <div className="bg-white border border-gray-200 p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Your current role:</p>
            <RoleBadge role={user.role} size="lg" />
            
            {requiredRoles && requiredRoles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Required role(s):</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {requiredRoles.map((role) => (
                    <span 
                      key={role}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-700 capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 btn-primary"
          >
            <Home className="w-4 h-4" />
            Back to Board Room 🏢
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          Need access? File a ticket with HR 👔 to request the appropriate clearance level.
        </p>
      </div>
    </div>
  );
}

/**
 * Inline forbidden message for components
 */
export function ForbiddenInline({ message = "You don't have permission to perform this action." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700">
      <ShieldX className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
