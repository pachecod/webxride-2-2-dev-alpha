/**
 * AuthGate Component
 * Shows sign-in page if not authenticated, otherwise shows app
 */

import React from 'react';
import { useAuth } from '../lib/auth';
import { SignInPage } from './AuthPages';
import { Loader } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-gray-300 text-lg">Loading WebXRide...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated (ONLY the sign-in page, nothing else)
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 overflow-auto">
        <SignInPage />
      </div>
    );
  }

  // User is authenticated - show the app
  // (Optional: Could add first-time user welcome here in the future)
  return <>{children}</>;
}

