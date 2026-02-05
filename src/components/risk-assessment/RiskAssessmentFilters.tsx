/**
 * Risk Assessment Filter Panel
 * Filters for agent, action type, result, date range, and search
 */
import { useState } from 'react';
import { Search, X, Filter, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditActionType, AuditResult, AuditFilters } from '../../types/audit';
import clsx from 'clsx';

interface RiskAssessmentFiltersProps {
  filters: AuditFilters;
  agents: string[];
  onFilterChange: (filters: AuditFilters) => void;
  onClearFilters: () => void;
}

const actionOptions: { value: AuditActionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'agent.start', label: 'Agent Started' },
  { value: 'agent.stop', label: 'Agent Stopped' },
  { value: 'agent.restart', label: 'Agent Restarted' },
  { value: 'agent.task.start', label: 'Task Started' },
  { value: 'agent.task.complete', label: 'Task Completed' },
  { value: 'agent.task.fail', label: 'Task Failed' },
  { value: 'agent.message', label: 'Message' },
  { value: 'commit', label: 'Commit' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'config.update', label: 'Config Update' },
  { value: 'user.create', label: 'User Created' },
  { value: 'user.update', label: 'User Updated' },
  { value: 'user.delete', label: 'User Deleted' },
  { value: 'error', label: 'Error' },
];

const resultOptions: { value: AuditResult | 'all'; label: string }[] = [
  { value: 'all', label: 'All Results' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'warning', label: 'Warning' },
];

export function RiskAssessmentFilters({
  filters,
  agents,
  onFilterChange,
  onClearFilters,
}: RiskAssessmentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.agent !== 'all' ||
    filters.action !== 'all' ||
    filters.result !== 'all' ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  const activeFilterCount = [
    filters.search !== '',
    filters.agent !== 'all',
    filters.action !== 'all',
    filters.result !== 'all',
    filters.dateFrom !== null || filters.dateTo !== null,
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border border-tkh-line mb-6">
      {/* Search Bar + Toggle */}
      <div className="p-4">
        <div className="flex gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tkh-grey" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search activities..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border transition-colors',
              hasActiveFilters
                ? 'bg-tkh-primary text-tkh-blue-dark border-tkh-primary font-bold'
                : 'bg-white text-tkh-blue border-tkh-grey-light hover:border-tkh-primary'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-tkh-blue-dark text-white text-xs px-1.5 py-0.5 font-bold">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-3 text-tkh-grey hover:text-tkh-blue transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-tkh-line">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* Agent Filter */}
            <div>
              <label className="block text-sm font-bold text-tkh-blue-dark mb-2">
                Agent
              </label>
              <select
                value={filters.agent}
                onChange={(e) => updateFilter('agent', e.target.value)}
                className="input-field"
              >
                <option value="all">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-bold text-tkh-blue-dark mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => updateFilter('action', e.target.value as AuditActionType | 'all')}
                className="input-field"
              >
                {actionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Result Filter */}
            <div>
              <label className="block text-sm font-bold text-tkh-blue-dark mb-2">
                Result
              </label>
              <select
                value={filters.result}
                onChange={(e) => updateFilter('result', e.target.value as AuditResult | 'all')}
                className="input-field"
              >
                {resultOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-bold text-tkh-blue-dark mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || null)}
                  className="input-field flex-1"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || null)}
                  className="input-field flex-1"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
