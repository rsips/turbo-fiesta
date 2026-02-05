import { AgentStatus } from '../types/agent';
import { Circle, CircleDot, CircleOff, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AgentStatus;
}

const statusConfig = {
  online: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Circle,
    label: 'Online',
  },
  busy: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: CircleDot,
    label: 'Busy',
  },
  offline: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CircleOff,
    label: 'Offline',
  },
  error: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Error',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
