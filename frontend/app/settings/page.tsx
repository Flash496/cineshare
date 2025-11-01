"use client";

import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center text-lg">
        Please log in to view your settings.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-4 border rounded-xl bg-background/50 p-6">
        <div>
          <div className="font-semibold mb-1">Display Name</div>
          <div className="bg-muted px-3 py-2 rounded">{user.displayName}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Email</div>
          <div className="bg-muted px-3 py-2 rounded">{user.email}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Username</div>
          <div className="bg-muted px-3 py-2 rounded">@{user.username}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Account ID</div>
          <div className="bg-muted px-3 py-2 rounded">{user.id}</div>
        </div>
      </div>

      {/* You can add more settings (change password, notifications, etc) below */}
      <div className="mt-10 text-gray-400 text-center">
        More user settings (like password, privacy, notifications) coming soon!
      </div>
    </div>
  );
}
