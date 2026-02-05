/**
 * Risk Assessment Page
 * Main activity feed showing agent reports from the field
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { RiskAssessmentHeader } from './RiskAssessmentHeader';
import { RiskAssessmentFilters } from './RiskAssessmentFilters';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorBanner } from '../ErrorBanner';
import { AuditLogEntry, AuditFilters, AuditQueryParams } from '../../types/audit';
import { getAuditLogs, getAuditAgents } from '../../api/audit';
import { useAuditWebSocket } from '../../hooks/useWebSocket';
import { Loader2, Radio } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 20;

const defaultFilters: AuditFilters = {
  search: '',
  agent: 'all',
  action: 'all',
  result: 'all',
  dateFrom: null,
  dateTo: null,
};

export function RiskAssessmentPage() {
  // State
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Build query params from filters
  const buildQueryParams = useCallback(
    (pageNum: number): AuditQueryParams => ({
      page: pageNum,
      pageSize: DEFAULT_PAGE_SIZE,
      agent: filters.agent !== 'all' ? filters.agent : undefined,
      action: filters.action !== 'all' ? filters.action : undefined,
      result: filters.result !== 'all' ? filters.result : undefined,
      search: filters.search || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    }),
    [filters]
  );

  // Fetch audit logs
  const fetchLogs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await getAuditLogs(buildQueryParams(pageNum));

        if (response.success) {
          if (append) {
            setEntries((prev) => [...prev, ...response.data.logs]);
          } else {
            setEntries(response.data.logs);
          }
          setHasMore(response.data.hasMore);
          setTotalCount(response.data.total);
          setPage(pageNum);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch audit logs');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch audit logs';
        setError(errorMessage);

        // Mock data for development
        if (isFirstLoad.current) {
          setEntries(generateMockData());
          setTotalCount(50);
          isFirstLoad.current = false;
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQueryParams]
  );

  // Fetch available agents for filter dropdown
  const fetchAgents = useCallback(async () => {
    try {
      const response = await getAuditAgents();
      setAgents(response.agents);
    } catch {
      // Use mock agents if API fails
      setAgents(['main-agent', 'data-pipeline', 'frontend-dev', 'backend-api', 'devops-bot']);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLogs(1);
    fetchAgents();
  }, [fetchLogs, fetchAgents]);

  // Reset and refetch when filters change
  useEffect(() => {
    if (!isFirstLoad.current) {
      setPage(1);
      fetchLogs(1);
    }
    isFirstLoad.current = false;
  }, [filters, fetchLogs]);

  // WebSocket handler for real-time updates
  const handleNewEntry = useCallback((entry: AuditLogEntry) => {
    setEntries((prev) => {
      // Check if entry already exists
      if (prev.some((e) => e.id === entry.id)) {
        return prev;
      }
      // Add to top
      return [entry, ...prev];
    });

    // Mark as new for animation
    setNewEntryIds((prev) => new Set(prev).add(entry.id));
    setTotalCount((prev) => prev + 1);

    // Remove "new" flag after animation
    setTimeout(() => {
      setNewEntryIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }, 3000);
  }, []);

  // WebSocket connection
  const { isConnected, isConnecting, error: wsError, reconnect } = useAuditWebSocket({
    enabled: true,
    onMessage: handleNewEntry,
  });

  // Infinite scroll - Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchLogs(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchLogs]);

  // Handlers
  const handleFilterChange = (newFilters: AuditFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchLogs(1);
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.agent !== 'all' ||
    filters.action !== 'all' ||
    filters.result !== 'all' ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <RiskAssessmentHeader
          isConnected={isConnected}
          isConnecting={isConnecting}
          wsError={wsError}
          onReconnect={reconnect}
          totalCount={totalCount}
          isLoading={loading}
          onRefresh={handleRefresh}
        />

        {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

        <RiskAssessmentFilters
          filters={filters}
          agents={agents}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Activity Feed */}
        {loading && entries.length === 0 ? (
          <LoadingSpinner />
        ) : entries.length === 0 ? (
          <RiskAssessmentEmptyState hasFilters={hasActiveFilters} />
        ) : (
          <>
            <div className="mb-4 text-sm text-tkh-grey">
              Showing {entries.length} of {totalCount.toLocaleString()} activities
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {entries.map((entry) => (
                <ActivityCard
                  key={entry.id}
                  entry={entry}
                  isNew={newEntryIds.has(entry.id)}
                />
              ))}
            </div>

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-tkh-grey">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
              {!hasMore && entries.length > 0 && (
                <div className="text-tkh-grey text-sm">
                  No more activities to load
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Empty state specific to Risk Assessment
function RiskAssessmentEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="bg-white border border-tkh-line p-12 text-center">
      <div className="w-16 h-16 bg-tkh-blue-dark mx-auto mb-4 flex items-center justify-center">
        <Radio className="w-8 h-8 text-tkh-primary" />
      </div>
      <h3 className="text-xl font-bold text-tkh-blue-dark mb-2">
        {hasFilters ? 'No Matching Activities' : 'No Activities Yet'}
      </h3>
      <p className="text-tkh-grey max-w-md mx-auto">
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : "Agent activities will appear here as they report in from the field."}
      </p>
    </div>
  );
}

// Mock data generator for development
function generateMockData(): AuditLogEntry[] {
  const actions = [
    'login',
    'agent.start',
    'agent.task.start',
    'agent.task.complete',
    'agent.task.fail',
    'commit',
    'deploy',
    'agent.message',
  ] as const;
  const results = ['success', 'failure', 'pending', 'warning'] as const;
  const agents = ['main-agent', 'data-pipeline', 'frontend-dev', 'backend-api', 'devops-bot'];

  return Array.from({ length: 20 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const result = action.includes('fail') ? 'failure' : results[Math.floor(Math.random() * 3)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const timestamp = new Date(Date.now() - i * 300000 - Math.random() * 60000).toISOString();

    return {
      id: `audit-${Date.now()}-${i}`,
      timestamp,
      agentId: `agent-${agent}`,
      agentName: agent,
      userId: null,
      userName: null,
      action,
      description: getActionDescription(action, agent),
      result,
      metadata: action.includes('fail') ? { error: 'Connection timeout after 30s' } : undefined,
    };
  });
}

function getActionDescription(action: string, agent: string): string {
  const descriptions: Record<string, string> = {
    'login': `User authenticated to Mission Control`,
    'agent.start': `${agent} came online and is ready for tasks`,
    'agent.task.start': `${agent} started processing a new task`,
    'agent.task.complete': `${agent} successfully completed the assigned task`,
    'agent.task.fail': `${agent} encountered an error while processing`,
    'commit': `${agent} committed changes to the repository`,
    'deploy': `${agent} initiated a deployment to production`,
    'agent.message': `${agent} sent a status update`,
  };
  return descriptions[action] || `${agent} performed an action`;
}
