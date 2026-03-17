import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import webxrideLogo from '../assets/webxride-logo.png';
import { supabase } from '../lib/supabase';

interface SimpleLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

interface PublicTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

export const SimpleLogin: React.FC<SimpleLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      // Call the onLogin callback which handles authentication
      await onLogin(username.trim(), password.trim());
      // If we get here, login was successful
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Load a small set of recent public templates for the playground
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND !== 'true') return;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const { data: folders } = await supabase.storage
          .from('templates')
          .list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });

        const topLevel = (folders || []).filter((folder: any) => {
          const hasSlash = folder.name.includes('/');
          const isNotMetadataFile = !folder.name.endsWith('metadata.json');
          const isNotTemplateOrder = folder.name !== 'template-order.json';
          const isNotSystemFile = !folder.name.startsWith('.');
          return !hasSlash && isNotMetadataFile && isNotTemplateOrder && isNotSystemFile;
        });

        type RawTemplate = { id: string; name: string; description?: string; thumbnailUrl?: string; createdAt?: number };
        const collected: RawTemplate[] = [];

        for (const folder of topLevel) {
          let meta: any = null;
          // Prefer cache-busting signed URL
          try {
            const { data: signed } = await supabase.storage
              .from('templates')
              .createSignedUrl(`${folder.name}/metadata.json`, 60);
            if (signed?.signedUrl) {
              const res = await fetch(signed.signedUrl, { cache: 'no-store' });
              if (res.ok) meta = await res.json();
            }
          } catch {
            // ignore; we'll fall back to direct download
          }

          // Fallback to direct download
          if (!meta) {
            try {
              const { data: metaFile } = await supabase.storage
                .from('templates')
                .download(`${folder.name}/metadata.json`);
              if (metaFile) {
                const text = await metaFile.text();
                meta = JSON.parse(text);
              }
            } catch {
              // ignore
            }
          }

          if (meta && meta.public_playground === true) {
            let createdAt = Date.parse(meta.created_at || meta.updated_at || '') || 0;
            if (!createdAt && (folder as any).created_at) {
              createdAt = Date.parse((folder as any).created_at) || 0;
            }
            collected.push({
              id: folder.name,
              name: meta.name || folder.name,
              description: meta.description || '',
              thumbnailUrl: typeof meta.thumbnail_url === 'string' ? meta.thumbnail_url : undefined,
              createdAt,
            });
          }
        }

        // Sort by most recent and take top 4
        collected.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const topFour = collected.slice(0, 4).map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          thumbnailUrl: t.thumbnailUrl,
        }));

        setTemplates(topFour);
      } catch (e) {
        console.error('Error loading public templates for login:', e);
        setTemplatesError('Failed to load public templates.');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo row spanning two columns */}
        <div className="text-center mb-10">
          <img
            src={webxrideLogo}
            alt="WebXRide Logo"
            className="h-20 w-20 mx-auto mb-4 rounded-full bg-white p-2 shadow-lg"
          />
          <h1 className="text-4xl font-bold text-white mb-2">WebXRide</h1>
          <p className="text-gray-300">WebXR Development Platform</p>
        </div>

        {/* Second row: login + public templates side by side */}
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Left: Login */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700 min-h-[420px]">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Login
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your username"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Log In
                    </>
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Don't have a password? Contact the administrator of this instance.
                </p>
                {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' && (
                  <p className="text-sm text-gray-300 mt-3">
                    Don't have an account?{' '}
                    <a href="/playground" className="text-blue-300 hover:text-blue-200 underline">Try public templates in the Playground</a>
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>Built for the WebXR community</p>
            </div>
          </div>

          {/* Right: Public templates preview */}
          {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' && (
            <div className="bg-gray-900/60 rounded-lg shadow-2xl p-6 border border-gray-700 w-full max-w-md mx-auto lg:mx-0 min-h-[420px]">
              <h2 className="text-xl font-semibold text-white mb-2">
                Try Public Templates
              </h2>
              <p className="text-sm text-gray-300 mb-4">
                Experiment with these example projects without signing in.
              </p>

              {templatesError && (
                <div className="mb-3 p-3 bg-red-900/40 border border-red-700 text-red-200 rounded text-xs">
                  {templatesError}
                </div>
              )}

              {templatesLoading ? (
                <div className="text-sm text-gray-400">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-gray-400">
                  No public templates are available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="bg-gray-800 rounded-md border border-gray-700 text-sm overflow-hidden p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white mb-1 truncate">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-gray-500 mb-2 truncate">
                            {t.id}
                          </div>
                          {t.description && (
                            <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                          <a
                            href={`/play/${t.id}?source=storage`}
                            className="inline-block mt-1 text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Open in Playground
                          </a>
                        </div>
                        {t.thumbnailUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={t.thumbnailUrl}
                              alt={t.name}
                              className="w-[100px] h-auto object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-right">
                <a
                  href="/playground"
                  className="text-xs text-blue-300 hover:text-blue-200 underline"
                >
                  View all templates →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


