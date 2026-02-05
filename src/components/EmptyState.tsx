import { ServerOff } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <ServerOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFilters ? 'No talent matches your criteria' : 'The Talent Pool is Empty 🏊'}
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {hasFilters
          ? 'Try adjusting your search or filter criteria to find more talent.'
          : 'No agents are currently clocked in. Start an agent to add them to the talent pool.'}
      </p>
    </div>
  );
}
