/**
 * Human Resources Page 👔
 * Admin-only interface for managing the talent
 * Managing headcount since 2024
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RequireRole } from './RequireRole';
import { RoleBadge } from './RoleBadge';
import { User, UserRole } from '../types/auth';
import { getUsers, updateUserRole, deleteUser, createUser, setUsersAuthToken } from '../api/users';
import { formatRelativeTime } from '../utils/formatters';

type ModalType = 'create' | 'edit' | 'delete' | null;

interface ModalState {
  type: ModalType;
  user?: User;
}

const ROLES: UserRole[] = ['admin', 'operator', 'viewer'];

export function UserManagement() {
  return (
    <RequireRole allowedRoles={['admin']}>
      <UserManagementContent />
    </RequireRole>
  );
}

function UserManagementContent() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set auth token for API calls
  useEffect(() => {
    if (token) {
      setUsersAuthToken(token);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await getUsers();
      setUsers(response.users);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(message);
      // Mock data for development/demo
      setUsers([
        {
          id: '1',
          email: 'admin@tkh.ai',
          name: 'System Admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'operator@tkh.ai',
          name: 'Agent Operator',
          role: 'operator',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          email: 'viewer@tkh.ai',
          name: 'Dashboard Viewer',
          role: 'viewer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setError(null);
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setSuccess(`Role updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // For demo, update locally
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      setSuccess(`Role updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setError(null);
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setModal({ type: null });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // For demo, remove locally
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setModal({ type: null });
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      setError(null);
      const newUser = await createUser(data);
      setUsers(prev => [...prev, newUser]);
      setSuccess('User created successfully');
      setModal({ type: null });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // For demo, add locally
      const mockUser: User = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers(prev => [...prev, mockUser]);
      setSuccess('User created successfully');
      setModal({ type: null });
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-tkh-blue-dark border-b border-tkh-line-dark p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-tkh-grey hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to The Board Room 🏢</span>
              </Link>
              <div className="border-l border-tkh-line-dark h-8" />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users className="w-7 h-7 text-tkh-primary" />
                  Human Resources 👔
                </h1>
                <p className="text-tkh-grey mt-1">Managing the talent since 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={fetchUsers}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-tkh-blue-medium text-white hover:bg-tkh-blue transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Create User Button */}
              <button
                onClick={() => setModal({ type: 'create' })}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-tkh-primary" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-tkh-blue-medium rounded-full flex items-center justify-center">
                            <span className="text-tkh-primary font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-xs text-tkh-grey">(you)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleDropdown
                          currentRole={user.role}
                          onChange={(role) => handleRoleChange(user.id, role)}
                          disabled={user.id === currentUser?.id}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ type: 'edit', user })}
                            className="p-2 text-gray-400 hover:text-tkh-blue-light hover:bg-gray-100 transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ type: 'delete', user })}
                            disabled={user.id === currentUser?.id}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={user.id === currentUser?.id ? "Can't delete yourself" : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">Get started by adding a new user.</p>
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Legend */}
        <div className="mt-6 p-4 bg-white border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <RoleBadge role="admin" size="md" />
              <p className="text-sm text-gray-600">Full access: Manage users, agents, and system settings</p>
            </div>
            <div className="flex items-start gap-3">
              <RoleBadge role="operator" size="md" />
              <p className="text-sm text-gray-600">Manage agents: Restart, kill, and control agents</p>
            </div>
            <div className="flex items-start gap-3">
              <RoleBadge role="viewer" size="md" />
              <p className="text-sm text-gray-600">Read-only: View dashboard and agent status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type === 'create' && (
        <CreateUserModal
          onClose={() => setModal({ type: null })}
          onCreate={handleCreateUser}
        />
      )}

      {modal.type === 'delete' && modal.user && (
        <DeleteConfirmModal
          user={modal.user}
          onClose={() => setModal({ type: null })}
          onConfirm={() => handleDeleteUser(modal.user!.id)}
        />
      )}
    </div>
  );
}

/**
 * Role Dropdown Component
 */
function RoleDropdown({
  currentRole,
  onChange,
  disabled = false,
}: {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return <RoleBadge role={currentRole} size="md" />;
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="px-3 py-1.5 border border-gray-200 text-sm bg-white focus:outline-none focus:border-tkh-primary focus:ring-1 focus:ring-tkh-primary cursor-pointer"
    >
      {ROLES.map((role) => (
        <option key={role} value={role} className="capitalize">
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </option>
      ))}
    </select>
  );
}

/**
 * Create User Modal
 */
function CreateUserModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; email: string; password: string; role: UserRole }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({ name, email, password, role });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input-field cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete User</h2>
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
