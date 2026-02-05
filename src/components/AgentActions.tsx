/**
 * Agent Actions Component
 * Role-based action buttons for agent management
 */
import { useState } from 'react';
import { 
  RotateCcw, 
  StopCircle, 
  Play, 
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { usePermissions } from './RequireRole';
import { Agent } from '../types/agent';
import clsx from 'clsx';

interface AgentActionsProps {
  agent: Agent;
  onRestart?: (agentId: string) => Promise<void>;
  onKill?: (agentId: string) => Promise<void>;
  onStart?: (agentId: string) => Promise<void>;
  variant?: 'row' | 'detail';
}

export function AgentActions({ 
  agent, 
  onRestart, 
  onKill, 
  onStart,
  variant = 'row' 
}: AgentActionsProps) {
  const { canManageAgents } = usePermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restart' | 'kill' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Viewer role - no actions
  if (!canManageAgents) {
    return null;
  }

  const handleAction = async (action: 'restart' | 'kill' | 'start') => {
    setIsLoading(true);
    try {
      if (action === 'restart' && onRestart) {
        await onRestart(agent.id);
      } else if (action === 'kill' && onKill) {
        await onKill(agent.id);
      } else if (action === 'start' && onStart) {
        await onStart(agent.id);
      }
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
      setIsMenuOpen(false);
    }
  };

  const isOnline = agent.status === 'online';
  const isBusy = agent.status === 'busy';
  const isOffline = agent.status === 'offline';

  // Row variant - compact dropdown
  if (variant === 'row') {
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }} 
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 shadow-lg z-20">
              {(isOnline || isBusy) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction('restart');
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
              )}
              
              {(isOnline || isBusy) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction('kill');
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Kill
                </button>
              )}

              {isOffline && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('start');
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-600 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              )}
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <ConfirmActionModal
            action={confirmAction}
            agentName={agent.name}
            isLoading={isLoading}
            onConfirm={() => handleAction(confirmAction)}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    );
  }

  // Detail variant - full buttons
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(isOnline || isBusy) && (
        <>
          <button
            onClick={() => setConfirmAction('restart')}
            disabled={isLoading}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 border transition-colors',
              'border-tkh-blue-light text-tkh-blue-light hover:bg-tkh-blue-light hover:text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Restart Agent
          </button>
          
          <button
            onClick={() => setConfirmAction('kill')}
            disabled={isLoading}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 border transition-colors',
              'border-red-500 text-red-500 hover:bg-red-500 hover:text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <StopCircle className="w-4 h-4" />
            Kill Agent
          </button>
        </>
      )}

      {isOffline && (
        <button
          onClick={() => handleAction('start')}
          disabled={isLoading}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 border transition-colors',
            'border-tkh-green text-tkh-green hover:bg-tkh-green hover:text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Play className="w-4 h-4" />
          Start Agent
        </button>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmActionModal
          action={confirmAction}
          agentName={agent.name}
          isLoading={isLoading}
          onConfirm={() => handleAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

/**
 * Confirm Action Modal
 */
function ConfirmActionModal({
  action,
  agentName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  action: 'restart' | 'kill';
  agentName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isKill = action === 'kill';

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white w-full max-w-md p-6">
        <div className={clsx(
          'flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4',
          isKill ? 'bg-red-100' : 'bg-yellow-100'
        )}>
          <AlertTriangle className={clsx(
            'w-6 h-6',
            isKill ? 'text-red-600' : 'text-yellow-600'
          )} />
        </div>
        
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          {isKill ? 'Kill Agent' : 'Restart Agent'}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isKill 
            ? `Are you sure you want to kill "${agentName}"? This will immediately terminate the agent.`
            : `Are you sure you want to restart "${agentName}"? The agent will briefly disconnect.`
          }
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'flex-1 py-2 px-4 text-white transition-colors disabled:opacity-50',
              isKill ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
            )}
          >
            {isLoading ? 'Processing...' : (isKill ? 'Kill' : 'Restart')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder for when actions are disabled (viewer mode)
 */
export function ViewerModeIndicator() {
  return (
    <div className="text-xs text-gray-400 italic">
      View only
    </div>
  );
}
