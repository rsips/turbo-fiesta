import { RefreshCw, Activity } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

interface DashboardHeaderProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onManualRefresh: () => void;
}

export function DashboardHeader({
  isRefreshing,
  lastUpdated,
  onManualRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Mission Control
          </h1>
          <p className="text-gray-600 mt-1">Agent Status Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {formatRelativeTime(lastUpdated.toISOString())}
            </div>
          )}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
