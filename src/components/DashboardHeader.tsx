/**
 * Dashboard Header Component
 * Shows Mission Control title, user info, and controls
 */
import { Link } from 'react-router-dom';
import { RefreshCw, Activity, LogOut, User, Shield, Users, Eye, Radio } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './RequireRole';
import { RoleBadge } from './RoleBadge';

interface DashboardHeaderProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onManualRefresh: () => void;
}

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  operator: User,
  viewer: Eye,
};

export function DashboardHeader({
  isRefreshing,
  lastUpdated,
  onManualRefresh,
}: DashboardHeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { canManageUsers } = usePermissions();

  const RoleIcon = user ? roleIcons[user.role] || User : User;

  return (
    <div className="bg-tkh-blue-dark border border-tkh-line-dark p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Logo & Title */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-tkh-primary" />
            Mission Control
          </h1>
          <p className="text-tkh-grey mt-1">Agent Status Dashboard</p>
        </div>

        {/* Right Section - User Info & Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-sm text-tkh-grey">
              Last updated: {formatRelativeTime(lastUpdated.toISOString())}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-tkh-primary text-tkh-blue-dark font-bold hover:bg-tkh-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* User Info & Logout */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-4 border-l border-tkh-line-dark">
              {/* Risk Assessment Link */}
              <Link
                to="/risk-assessment"
                className="flex items-center gap-2 px-3 py-2 text-tkh-grey hover:text-white hover:bg-tkh-blue-medium transition-colors"
                title="Agent Activity Feed"
              >
                <Radio className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Risk Assessment</span>
              </Link>

              {/* Admin: User Management Link */}
              {canManageUsers && (
                <Link
                  to="/users"
                  className="flex items-center gap-2 px-3 py-2 text-tkh-grey hover:text-white hover:bg-tkh-blue-medium transition-colors"
                  title="User Management"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">Users</span>
                </Link>
              )}

              {/* User Badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-tkh-blue-medium rounded-full flex items-center justify-center">
                  <RoleIcon className="w-4 h-4 text-tkh-primary" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-white text-sm font-bold">{user.name}</div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={user.role} size="sm" showIcon={false} />
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-tkh-grey hover:text-white hover:bg-tkh-blue-medium transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
