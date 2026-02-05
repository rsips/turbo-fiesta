import { Search, X } from 'lucide-react';
import { AgentStatus } from '../types/agent';

interface FilterBarProps {
  searchQuery: string;
  statusFilter: AgentStatus | 'all';
  onSearchChange: (query: string) => void;
  onStatusChange: (status: AgentStatus | 'all') => void;
  onClearFilters: () => void;
}

export function FilterBar({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search agents by name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="min-w-[150px]">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as AgentStatus | 'all')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
