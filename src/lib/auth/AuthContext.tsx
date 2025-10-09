/**
 * Auth Abstraction Layer - React Context
 * Provider-agnostic authentication context
 */

import { createContext, useContext } from 'react';
import { AuthState } from './types';

/**
 * Auth Context - Never changes regardless of provider
 */
export const AuthContext = createContext<AuthState | null>(null);

/**
 * Hook to access auth state and methods
 * Use this throughout your app instead of provider-specific hooks
 */
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your app is wrapped with <AuthProvider>...</AuthProvider>'
    );
  }
  
  return context;
};

/**
 * Hook to check if user has admin privileges
 */
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  return user?.metadata?.is_admin === true;
};

/**
 * Hook to check subscription tier
 */
export const useSubscriptionTier = () => {
  const { user } = useAuth();
  return user?.metadata?.subscription_tier || 'free';
};

/**
 * Hook to check if user can upload (quota checks)
 */
export const useCanUpload = (fileSizeMb: number): { allowed: boolean; reason?: string } => {
  const { user } = useAuth();
  
  if (!user) {
    return { allowed: false, reason: 'not_authenticated' };
  }
  
  const metadata = user.metadata;
  
  // Check file count limit
  if (metadata.max_files !== -1 && (metadata.files_count || 0) >= metadata.max_files) {
    return { allowed: false, reason: 'file_limit_reached' };
  }
  
  // Check storage limit
  const currentStorage = metadata.storage_used_mb || 0;
  const newStorage = currentStorage + fileSizeMb;
  
  if (metadata.max_storage_mb !== -1 && newStorage > metadata.max_storage_mb) {
    return { allowed: false, reason: 'storage_limit_reached' };
  }
  
  return { allowed: true };
};

