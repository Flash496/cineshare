// frontend/components/presence/status-dropdown.tsx
'use client';

import { useCurrentUserStatus } from '@/hooks/use-presence';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Circle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusDropdown() {
  const { status, setStatus } = useCurrentUserStatus();

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      default:
        return 'Offline';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Circle className={cn('h-3 w-3 fill-current', getStatusColor(status))} />
          <span className="text-sm">{getStatusLabel(status)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setStatus('online')}>
          <Circle className="mr-2 h-3 w-3 fill-current text-green-500" />
          Online
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStatus('away')}>
          <Circle className="mr-2 h-3 w-3 fill-current text-yellow-500" />
          Away
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}