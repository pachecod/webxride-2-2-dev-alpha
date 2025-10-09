/**
 * Mock Auth Provider - For Testing
 * Simulates authentication without external services
 */

import React, { useState, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { User, AuthState, AuthError } from '../types';

interface MockAuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

/**
 * Mock users for testing
 */
const MOCK_USERS: Record<string, User> = {
  'admin@webxride.com': {
    id: 'mock-admin-123',
    email: 'admin@webxride.com',
    name: 'Admin User',
    avatar_url: undefined,
    metadata: {
      subscription_tier: 'enterprise',
      max_storage_mb: -1,
      max_files: -1,
      storage_used_mb: 500,
      files_count: 42,
      is_admin: true
    }
  },
  'student@webxride.com': {
    id: 'mock-student-456',
    email: 'student@webxride.com',
    name: 'Student User',
    avatar_url: undefined,
    metadata: {
      subscription_tier: 'student',
      max_storage_mb: 1024,
      max_files: 500,
      storage_used_mb: 250,
      files_count: 85,
      is_admin: false
    }
  },
  'free@webxride.com': {
    id: 'mock-free-789',
    email: 'free@webxride.com',
    name: 'Free User',
    avatar_url: undefined,
    metadata: {
      subscription_tier: 'free',
      max_storage_mb: 100,
      max_files: 50,
      storage_used_mb: 75,
      files_count: 38,
      is_admin: false
    }
  }
};

/**
 * Mock Auth Provider Component
 * Stores auth state in localStorage for persistence
 */
export function MockAuthProvider({ children, initialUser = null }: MockAuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mock_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('mock_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('mock_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mock_auth_user');
    }
  }, [user]);

  const signIn = async (email: string, password: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = MOCK_USERS[email];
    
    if (!mockUser) {
      throw new AuthError('Invalid email or password', 'invalid_credentials', 'mock');
    }
    
    // For mock, any password works (in real provider, this would be validated)
    console.log('[MockAuth] Sign in:', email);
    setUser(mockUser);
  };

  const signUp = async (email: string, password: string, name?: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    if (MOCK_USERS[email]) {
      throw new AuthError('User already exists', 'user_exists', 'mock');
    }
    
    // Create new mock user
    const newUser: User = {
      id: `mock-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      avatar_url: undefined,
      metadata: {
        subscription_tier: 'free',
        max_storage_mb: 100,
        max_files: 50,
        storage_used_mb: 0,
        files_count: 0,
        is_admin: false
      }
    };
    
    console.log('[MockAuth] Sign up:', email);
    setUser(newUser);
  };

  const signOut = async (): Promise<void> => {
    console.log('[MockAuth] Sign out');
    setUser(null);
  };

  const updateMetadata = async (metadata: Partial<User['metadata']>): Promise<void> => {
    if (!user) {
      throw new AuthError('No user signed in', 'no_user', 'mock');
    }
    
    console.log('[MockAuth] Update metadata:', metadata);
    
    setUser({
      ...user,
      metadata: {
        ...user.metadata,
        ...metadata
      }
    });
  };

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    // Return a fake JWT token for testing
    return `mock_token_${user.id}_${Date.now()}`;
  };

  const authState: AuthState = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateMetadata,
    getToken
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Helper to quickly sign in with a mock user
 */
export const mockSignIn = (email: keyof typeof MOCK_USERS) => {
  const user = MOCK_USERS[email];
  if (user) {
    localStorage.setItem('mock_auth_user', JSON.stringify(user));
    window.location.reload();
  }
};

/**
 * Helper to clear mock auth
 */
export const mockSignOut = () => {
  localStorage.removeItem('mock_auth_user');
  window.location.reload();
};

