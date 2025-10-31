// frontend/app/notifications/page.tsx
import { Metadata } from 'next';
import { NotificationsList } from '@/components/notifications/notifications-list';

export const metadata: Metadata = {
  title: 'Notifications | CineShare',
  description: 'View all your notifications',
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Stay updated with your latest activity
        </p>
      </div>
      <NotificationsList />
    </div>
  );
}