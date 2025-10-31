// frontend/app/messages/page.tsx
import { Metadata } from 'next';
import { DirectMessagesClient } from '@/components/messages/direct-messages-client';

export const metadata: Metadata = {
  title: 'Messages | CineShare',
  description: 'Direct messages with other users',
};

export default function MessagesPage() {
  return <DirectMessagesClient />;
}
