// frontend/components/users/user-card-with-presence.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/presence/online-indicator';
import Link from 'next/link';

interface UserCardWithPresenceProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export function UserCardWithPresence({ user }: UserCardWithPresenceProps) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.displayName[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator userId={user.id} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.displayName}</p>
        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
      </div>
    </Link>
  );
}