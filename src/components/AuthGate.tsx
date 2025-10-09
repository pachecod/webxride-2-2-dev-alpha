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

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return <SignInPage />;
  }

  // Show welcome message for first-time users
  if (user && user.metadata.files_count === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8 mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to WebXRide, {user.name || user.email}! 🎉
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Your account is ready. Let's get you started!
            </p>

            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-3">Your Plan:</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded">
                  <p className="text-gray-400 text-sm">Subscription</p>
                  <p className="text-white text-xl font-bold capitalize">
                    {user.metadata.subscription_tier}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <p className="text-gray-400 text-sm">Storage Limit</p>
                  <p className="text-white text-xl font-bold">
                    {user.metadata.max_storage_mb === -1
                      ? 'Unlimited'
                      : `${user.metadata.max_storage_mb} MB`}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <p className="text-gray-400 text-sm">File Limit</p>
                  <p className="text-white text-xl font-bold">
                    {user.metadata.max_files === -1
                      ? 'Unlimited'
                      : `${user.metadata.max_files} files`}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <p className="text-gray-400 text-sm">Role</p>
                  <p className="text-white text-xl font-bold">
                    {user.metadata.is_admin ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-200 mb-3">
                🚀 Quick Start Guide:
              </h3>
              <ol className="space-y-2 text-blue-100">
                <li>1. Browse templates on the left sidebar</li>
                <li>2. Select a template to start editing</li>
                <li>3. Upload your own images, 3D models, and audio files</li>
                <li>4. Tag your files for easy organization</li>
                <li>5. Save and export your projects</li>
              </ol>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // User is authenticated and has used the app before - show normal app
  return <>{children}</>;
}

