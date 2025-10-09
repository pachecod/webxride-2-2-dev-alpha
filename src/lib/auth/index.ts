/**
 * Auth Abstraction Layer - Main Export
 * Import everything you need from here
 */

// Types
export type { User, AuthState, UserMetadata, AuthProviderConfig } from './types';
export { AuthError, SUBSCRIPTION_TIERS } from './types';

// Context and hooks
export { AuthContext, useAuth, useIsAdmin, useSubscriptionTier, useCanUpload } from './AuthContext';

// Provider
export { AuthProvider, authConfig } from './config';

// Testing utilities
export { mockSignIn, mockSignOut } from './providers/MockAuthProvider';

