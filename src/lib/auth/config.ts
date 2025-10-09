/**
 * Auth Provider Configuration
 * SINGLE PLACE to switch between auth providers
 */

import { MockAuthProvider } from './providers/MockAuthProvider';
// import { ClerkAuthProvider } from './providers/ClerkAuthProvider';
// import { SupabaseAuthProvider } from './providers/SupabaseAuthProvider';

/**
 * Auth provider selection
 * Change this ONE line to swap providers
 */

// For local testing - no external services needed
export const AuthProvider = MockAuthProvider;

// For Clerk (uncomment when ready)
// export const AuthProvider = ClerkAuthProvider;

// For Supabase Auth (if we fix the session issues)
// export const AuthProvider = SupabaseAuthProvider;

/**
 * Get provider from environment variable (optional)
 */
export const getAuthProvider = () => {
  const provider = import.meta.env.VITE_AUTH_PROVIDER || 'mock';
  
  switch (provider) {
    case 'mock':
      return MockAuthProvider;
    // case 'clerk':
    //   return ClerkAuthProvider;
    // case 'supabase':
    //   return SupabaseAuthProvider;
    default:
      console.warn(`Unknown auth provider: ${provider}, falling back to mock`);
      return MockAuthProvider;
  }
};

/**
 * Auth configuration
 */
export const authConfig = {
  provider: import.meta.env.VITE_AUTH_PROVIDER || 'mock',
  
  // Clerk config
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  
  // Supabase config (already have these)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

