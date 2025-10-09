/**
 * Auth Abstraction Layer - Type Definitions
 * Provider-agnostic authentication types
 */

/**
 * User metadata for subscription and quota management
 */
export interface UserMetadata {
  subscription_tier: 'free' | 'student' | 'pro' | 'enterprise';
  max_storage_mb: number;
  max_files: number;
  storage_used_mb?: number;
  files_count?: number;
  is_admin?: boolean;
  class_id?: string;
}

/**
 * Universal user object (provider-agnostic)
 */
export interface User {
  id: string;                    // Universal user ID (from any provider)
  email: string;
  name?: string;
  avatar_url?: string;
  metadata: UserMetadata;
}

/**
 * Auth state and methods
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // User management
  updateMetadata: (metadata: Partial<UserMetadata>) => Promise<void>;
  getToken: () => Promise<string | null>;
  
  // Legacy support for existing WebXRide features
  selectUser?: (username: string) => void;  // For backward compatibility during transition
}

/**
 * Auth provider configuration
 */
export interface AuthProviderConfig {
  provider: 'mock' | 'clerk' | 'supabase' | 'auth0';
  publishableKey?: string;
  apiUrl?: string;
}

/**
 * Auth error types
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Subscription tier definitions
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    max_storage_mb: 100,
    max_files: 50,
    features: ['Basic features', 'Community support', '100MB storage', '50 files']
  },
  student: {
    name: 'Student',
    price: 5,
    max_storage_mb: 1024,
    max_files: 500,
    features: ['All features', 'Email support', '1GB storage', '500 files', 'Tag collections']
  },
  pro: {
    name: 'Pro',
    price: 15,
    max_storage_mb: 10240,
    max_files: -1, // unlimited
    features: ['Everything in Student', 'Priority support', '10GB storage', 'Unlimited files', 'API access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 200,
    max_storage_mb: -1, // unlimited
    max_files: -1, // unlimited
    features: ['Everything in Pro', '24/7 support', 'Unlimited storage', 'Multi-user management', 'Custom branding']
  }
} as const;

