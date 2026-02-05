import { Agent, SortField, SortOrder } from '../types/agent';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime, formatDuration, truncateText, formatAbsoluteTime } from '../utils/formatters';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AgentActions, ViewerModeIndicator } from './AgentActions';
import { usePermissions } from './RequireRole';

interface AgentListTableProps {
  agents: Agent[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onAgentClick: (agent: Agent) => void;
  onRestartAgent?: (agentId: string) => Promise<void>;
  onKillAgent?: (agentId: string) => Promise<void>;
  onStartAgent?: (agentId: string) => Promise<void>;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortableHeader({ field, label, currentField, currentOrder, onSort }: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th
      onClick={() => onSort(field)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
    >
      <div className="flex items-center gap-2">
        {label}
        {isActive && (
          <span>
            {currentOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function AgentListTable({
  agents,
  sortField,
  sortOrder,
  onSort,
  onAgentClick,
  onRestartAgent,
  onKillAgent,
  onStartAgent,
}: AgentListTableProps) {
  const { canManageAgents } = usePermissions();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                field="name"
                label="Agent Name"
                currentField={sortField}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                field="status"
                label="Status"
                currentField={sortField}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Task
              </th>
              <SortableHeader
                field="last_activity"
                label="Last Activity"
                currentField={sortField}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                field="uptime"
                label="Uptime"
                currentField={sortField}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr
                key={agent.id}
                onClick={() => onAgentClick(agent)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {truncateText(agent.session_id, 40)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={agent.status} />
                </td>
                <td className="px-6 py-4">
                  <div
                    className="text-sm text-gray-900 max-w-md"
                    title={agent.current_task || undefined}
                  >
                    {agent.current_task ? truncateText(agent.current_task, 60) : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm text-gray-900"
                    title={formatAbsoluteTime(agent.last_activity)}
                  >
                    {formatRelativeTime(agent.last_activity)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDuration(agent.uptime_seconds)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {canManageAgents ? (
                    <AgentActions
                      agent={agent}
                      variant="row"
                      onRestart={onRestartAgent}
                      onKill={onKillAgent}
                      onStart={onStartAgent}
                    />
                  ) : (
                    <ViewerModeIndicator />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
