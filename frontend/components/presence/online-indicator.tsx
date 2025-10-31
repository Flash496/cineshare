// frontend/components/presence/online-indicator.tsx
'use client';

import { useUserStatus } from '@/hooks/use-presence';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function OnlineIndicator({
  userId,
  size = 'md',
  showLabel = false,
  className,
}: OnlineIndicatorProps) {
  const status = useUserStatus(userId);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  const statusLabels = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-block rounded-full',
          sizeClasses[size],
          statusColors[status]
        )}
        title={statusLabels[status]}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground capitalize">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}