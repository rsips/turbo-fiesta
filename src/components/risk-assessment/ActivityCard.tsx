/**
 * Activity Card Component
 * Displays a single audit log entry with agent info, action, and result
 */
import { memo } from 'react';
import {
  Bot,
  User,
  LogIn,
  LogOut,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  GitCommit,
  Rocket,
  Settings,
  UserPlus,
  UserMinus,
  Edit,
  Zap,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { AuditLogEntry, AuditActionType, AuditResult } from '../../types/audit';
import { formatRelativeTime } from '../../utils/formatters';
import clsx from 'clsx';

interface ActivityCardProps {
  entry: AuditLogEntry;
  isNew?: boolean;
}

// Action type configurations
const actionConfig: Record<AuditActionType, { icon: typeof Bot; label: string; color: string }> = {
  'login': { icon: LogIn, label: 'Login', color: 'text-tkh-blue-light' },
  'logout': { icon: LogOut, label: 'Logout', color: 'text-tkh-grey' },
  'agent.start': { icon: Play, label: 'Agent Started', color: 'text-tkh-green' },
  'agent.stop': { icon: Square, label: 'Agent Stopped', color: 'text-tkh-grey' },
  'agent.restart': { icon: RefreshCw, label: 'Agent Restarted', color: 'text-tkh-blue-sky' },
  'agent.task.start': { icon: Zap, label: 'Task Started', color: 'text-tkh-primary' },
  'agent.task.complete': { icon: CheckCircle, label: 'Task Completed', color: 'text-tkh-green' },
  'agent.task.fail': { icon: XCircle, label: 'Task Failed', color: 'text-red-500' },
  'agent.message': { icon: MessageSquare, label: 'Message', color: 'text-tkh-blue' },
  'commit': { icon: GitCommit, label: 'Commit', color: 'text-purple-500' },
  'deploy': { icon: Rocket, label: 'Deploy', color: 'text-tkh-blue-sky' },
  'config.update': { icon: Settings, label: 'Config Updated', color: 'text-tkh-grey' },
  'user.create': { icon: UserPlus, label: 'User Created', color: 'text-tkh-green' },
  'user.update': { icon: Edit, label: 'User Updated', color: 'text-tkh-blue-light' },
  'user.delete': { icon: UserMinus, label: 'User Deleted', color: 'text-red-500' },
  'api.call': { icon: Zap, label: 'API Call', color: 'text-tkh-blue' },
  'error': { icon: AlertTriangle, label: 'Error', color: 'text-red-500' },
  'unknown': { icon: HelpCircle, label: 'Unknown', color: 'text-tkh-grey' },
};

// Result badge configurations
const resultConfig: Record<AuditResult, { icon: typeof CheckCircle; label: string; className: string }> = {
  'success': {
    icon: CheckCircle,
    label: 'Success',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  'failure': {
    icon: XCircle,
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  'pending': {
    icon: Clock,
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  'warning': {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
};

function ActivityCardComponent({ entry, isNew = false }: ActivityCardProps) {
  const action = actionConfig[entry.action] || actionConfig['unknown'];
  const result = resultConfig[entry.result];
  const ActionIcon = action.icon;
  const ResultIcon = result.icon;

  // Determine if this is an agent action or user action
  const isAgentAction = entry.agentId !== null;
  const actorName = isAgentAction ? entry.agentName : entry.userName;
  const actorId = isAgentAction ? entry.agentId : entry.userId;

  return (
    <div
      className={clsx(
        'bg-white border border-tkh-line p-4 transition-all duration-300',
        isNew && 'animate-slide-in ring-2 ring-tkh-primary ring-opacity-50'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar/Icon */}
        <div
          className={clsx(
            'w-10 h-10 flex-shrink-0 flex items-center justify-center',
            isAgentAction ? 'bg-tkh-blue-dark' : 'bg-tkh-blue-medium'
          )}
        >
          {isAgentAction ? (
            <Bot className="w-5 h-5 text-tkh-primary" />
          ) : (
            <User className="w-5 h-5 text-tkh-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Actor + Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-tkh-blue-dark truncate">
              {actorName || actorId || 'System'}
            </span>
            <div className={clsx('flex items-center gap-1', action.color)}>
              <ActionIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-tkh-blue mt-1 text-sm leading-relaxed">
            {entry.description}
          </p>

          {/* Metadata (if present) */}
          {entry.metadata?.target && (
            <div className="mt-2 text-xs text-tkh-grey">
              Target: <span className="font-mono text-tkh-blue">{entry.metadata.target}</span>
            </div>
          )}
          {entry.metadata?.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 font-mono">
              {entry.metadata.error}
            </div>
          )}

          {/* Footer: Timestamp + Result */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-tkh-line">
            <span className="text-xs text-tkh-grey flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(entry.timestamp)}
            </span>

            {/* Result Badge */}
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border',
                result.className
              )}
            >
              <ResultIcon className="w-3 h-3" />
              {result.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ActivityCard = memo(ActivityCardComponent);
