import { X, Copy, Check } from 'lucide-react';
import { Agent } from '../types/agent';
import { StatusBadge } from './StatusBadge';
import { formatAbsoluteTime, formatDuration } from '../utils/formatters';
import { useState } from 'react';
import { AgentActions } from './AgentActions';
import { usePermissions } from './RequireRole';

interface AgentDetailModalProps {
  agent: Agent | null;
  onClose: () => void;
  onRestartAgent?: (agentId: string) => Promise<void>;
  onKillAgent?: (agentId: string) => Promise<void>;
  onStartAgent?: (agentId: string) => Promise<void>;
}

export function AgentDetailModal({ 
  agent, 
  onClose,
  onRestartAgent,
  onKillAgent,
  onStartAgent,
}: AgentDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const { canManageAgents } = usePermissions();

  if (!agent) return null;

  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(agent.session_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
            <div className="mt-2">
              <StatusBadge status={agent.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono break-all">
                {agent.session_id}
              </code>
              <button
                onClick={handleCopySessionId}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Current Task */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Task</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
              {agent.current_task || '—'}
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Activity
              </label>
              <p className="text-gray-900">{formatAbsoluteTime(agent.last_activity)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Started At</label>
              <p className="text-gray-900">{formatAbsoluteTime(agent.started_at)}</p>
            </div>
          </div>

          {/* Uptime */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Uptime</label>
            <p className="text-gray-900">{formatDuration(agent.uptime_seconds)}</p>
          </div>

          {/* Task Started */}
          {agent.task_started_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Started
              </label>
              <p className="text-gray-900">{formatAbsoluteTime(agent.task_started_at)}</p>
            </div>
          )}

          {/* Metadata */}
          {agent.metadata && Object.keys(agent.metadata).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                {Object.entries(agent.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                      {key}:
                    </span>
                    <span className="text-sm text-gray-900 break-all">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {/* Agent Actions (Admin/Operator only) */}
          <div>
            {canManageAgents ? (
              <AgentActions
                agent={agent}
                variant="detail"
                onRestart={onRestartAgent}
                onKill={onKillAgent}
                onStart={onStartAgent}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">View only mode</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
