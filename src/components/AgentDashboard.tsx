import { useState, useCallback } from 'react';
import { Agent, Filters, Sort, AgentStatus, SortField } from '../types/agent';
import { getAgents } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { sortAgents, filterAgents } from '../utils/sorting';
import { DashboardHeader } from './DashboardHeader';
import { FilterBar } from './FilterBar';
import { AgentListTable } from './AgentListTable';
import { AgentDetailModal } from './AgentDetailModal';
import { ErrorBanner } from './ErrorBanner';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { config } from '../config';
import { usePermissions } from './RequireRole';

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { canManageAgents } = usePermissions();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
  });

  const [sort, setSort] = useState<Sort>({
    field: 'status',
    order: 'asc',
  });

  // Fetch agents from API
  const fetchAgents = useCallback(async () => {
    try {
      setError(null);
      const response = await getAgents();
      
      if (response.success) {
        setAgents(response.data.agents);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.error?.message || 'Failed to fetch agents');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch agents';
      setError(errorMessage);
      // Keep showing old data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    setLoading(true);
    fetchAgents();
  }, [fetchAgents]);

  // Setup auto-refresh polling
  usePolling(fetchAgents, config.pollInterval);

  // Filter and sort agents
  const filteredAgents = filterAgents(agents, filters.search, filters.status);
  const sortedAgents = sortAgents(filteredAgents, sort);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle filters
  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const handleStatusChange = (status: AgentStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', status: 'all' });
  };

  // Handle agent selection
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  // Agent action handlers (placeholder implementations)
  const handleRestartAgent = useCallback(async (agentId: string) => {
    if (!canManageAgents) return;
    console.log('Restarting agent:', agentId);
    // TODO: Implement API call to restart agent
    // await restartAgent(agentId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    await fetchAgents(); // Refresh the list
  }, [canManageAgents, fetchAgents]);

  const handleKillAgent = useCallback(async (agentId: string) => {
    if (!canManageAgents) return;
    console.log('Killing agent:', agentId);
    // TODO: Implement API call to kill agent
    // await killAgent(agentId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    await fetchAgents(); // Refresh the list
  }, [canManageAgents, fetchAgents]);

  const handleStartAgent = useCallback(async (agentId: string) => {
    if (!canManageAgents) return;
    console.log('Starting agent:', agentId);
    // TODO: Implement API call to start agent
    // await startAgent(agentId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    await fetchAgents(); // Refresh the list
  }, [canManageAgents, fetchAgents]);

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <DashboardHeader
          isRefreshing={loading}
          lastUpdated={lastUpdated}
          onManualRefresh={handleManualRefresh}
        />

        {error && <ErrorBanner message={error} onRetry={handleManualRefresh} />}

        <FilterBar
          searchQuery={filters.search}
          statusFilter={filters.status}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onClearFilters={handleClearFilters}
        />

        {loading && agents.length === 0 ? (
          <LoadingSpinner />
        ) : sortedAgents.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {sortedAgents.length} of {agents.length} agents
            </div>
            <AgentListTable
              agents={sortedAgents}
              sortField={sort.field}
              sortOrder={sort.order}
              onSort={handleSort}
              onAgentClick={handleAgentClick}
              onRestartAgent={handleRestartAgent}
              onKillAgent={handleKillAgent}
              onStartAgent={handleStartAgent}
            />
          </>
        )}

        <AgentDetailModal 
          agent={selectedAgent} 
          onClose={handleCloseModal}
          onRestartAgent={handleRestartAgent}
          onKillAgent={handleKillAgent}
          onStartAgent={handleStartAgent}
        />
      </div>
    </div>
  );
}
