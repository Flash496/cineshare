export { useAuth } from '@/contexts/auth-context';

// Usage in components:
// const { user, login, logout, isLoading } = useAuth();
// This hook provides authentication state and methods.
//// Available properties and methods:
// - user: The authenticated user object or null if not authenticated.
// - accessToken: JWT access token string.