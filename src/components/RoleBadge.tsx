/**
 * RoleBadge Component
 * Visual indicator for user roles with TKH styling
 */
import { Shield, User, Eye } from 'lucide-react';
import { UserRole } from '../types/auth';
import clsx from 'clsx';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const roleConfig: Record<UserRole, {
  label: string;
  icon: typeof Shield;
  colors: string;
}> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    colors: 'bg-red-100 text-red-800 border-red-200',
  },
  operator: {
    label: 'Operator',
    icon: User,
    colors: 'bg-tkh-blue-light/20 text-tkh-blue-light border-tkh-blue-light/30',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    colors: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function RoleBadge({ role, size = 'sm', showIcon = true, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border capitalize',
        config.colors,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

/**
 * Compact role indicator for table cells
 */
export function RoleIndicator({ role }: { role: UserRole }) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center',
          role === 'admin' && 'bg-red-100',
          role === 'operator' && 'bg-tkh-blue-light/20',
          role === 'viewer' && 'bg-gray-100'
        )}
      >
        <Icon
          className={clsx(
            'w-3.5 h-3.5',
            role === 'admin' && 'text-red-600',
            role === 'operator' && 'text-tkh-blue-light',
            role === 'viewer' && 'text-gray-600'
          )}
        />
      </div>
      <span className="capitalize text-sm">{role}</span>
    </div>
  );
}
