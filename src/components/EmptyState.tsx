import { ServerOff } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <ServerOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFilters ? 'No agents match your filters' : 'No agents running'}
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {hasFilters
          ? 'Try adjusting your search or filter criteria to see more results.'
          : 'No agents are currently active. Start an agent to see it here.'}
      </p>
    </div>
  );
}
