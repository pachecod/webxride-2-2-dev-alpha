/**
 * Authentication Pages
 * Sign In and Sign Up forms
 */

import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return <SignUpPage onBackToSignIn={() => setShowSignUp(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">WebXRide</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Mock user quick-select for testing */}
        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded p-3 mb-6">
          <p className="text-yellow-200 text-sm font-semibold mb-2">🧪 Testing Mode - Quick Sign In:</p>
          <div className="space-y-1">
            <button
              onClick={() => {
                setEmail('admin@webxride.com');
                setPassword('test');
              }}
              className="w-full text-left text-xs text-yellow-100 hover:text-white px-2 py-1 rounded hover:bg-yellow-800 transition-colors"
            >
              👤 Admin (unlimited storage)
            </button>
            <button
              onClick={() => {
                setEmail('student@webxride.com');
                setPassword('test');
              }}
              className="w-full text-left text-xs text-yellow-100 hover:text-white px-2 py-1 rounded hover:bg-yellow-800 transition-colors"
            >
              🎓 Student (1GB storage, 500 files)
            </button>
            <button
              onClick={() => {
                setEmail('free@webxride.com');
                setPassword('test');
              }}
              className="w-full text-left text-xs text-yellow-100 hover:text-white px-2 py-1 rounded hover:bg-yellow-800 transition-colors"
            >
              🆓 Free User (100MB, 50 files)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowSignUp(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Don't have an account? <span className="underline">Sign up</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface SignUpPageProps {
  onBackToSignIn: () => void;
}

export function SignUpPage({ onBackToSignIn }: SignUpPageProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, name);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">WebXRide</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToSignIn}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Already have an account? <span className="underline">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}

