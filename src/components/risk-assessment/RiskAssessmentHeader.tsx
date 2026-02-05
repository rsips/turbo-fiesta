/**
 * Risk Assessment Header Component
 * Shows "Risk Assessment" title with TKH branding and connection status
 */
import { Link } from 'react-router-dom';
import {
  Radio,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  ArrowLeft,
  LogOut,
  User,
  Shield,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RoleBadge } from '../RoleBadge';
import clsx from 'clsx';

interface RiskAssessmentHeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  wsError: string | null;
  onReconnect: () => void;
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  operator: User,
  viewer: Eye,
};

export function RiskAssessmentHeader({
  isConnected,
  isConnecting,
  wsError,
  onReconnect,
  totalCount,
  isLoading,
  onRefresh,
}: RiskAssessmentHeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const RoleIcon = user ? roleIcons[user.role] || User : User;

  return (
    <div className="bg-tkh-blue-dark border border-tkh-line-dark p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Logo & Title */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/"
              className="text-tkh-grey hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-tkh-primary" />
            Risk Assessment
          </h1>
          <p className="text-tkh-grey mt-1">See what the risk is up to 🦞</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Connection Status */}
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-2',
              isConnected && 'text-tkh-green',
              isConnecting && 'text-tkh-primary',
              !isConnected && !isConnecting && 'text-tkh-grey'
            )}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Connecting...</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Live</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tkh-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tkh-green"></span>
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">{wsError || 'Disconnected'}</span>
                <button
                  onClick={onReconnect}
                  className="text-xs text-tkh-primary hover:underline ml-1"
                >
                  Reconnect
                </button>
              </>
            )}
          </div>

          {/* Activity Count */}
          <div className="text-sm text-tkh-grey border-l border-tkh-line-dark pl-4">
            <span className="text-white font-bold">{totalCount.toLocaleString()}</span> activities
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-tkh-primary text-tkh-blue-dark font-bold hover:bg-tkh-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>

          {/* User Info & Logout */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-4 border-l border-tkh-line-dark">
              {/* User Badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-tkh-blue-medium rounded-full flex items-center justify-center">
                  <RoleIcon className="w-4 h-4 text-tkh-primary" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-white text-sm font-bold">{user.name}</div>
                  <RoleBadge role={user.role} size="sm" showIcon={false} />
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
