/**
 * Authentication Pages
 * Sign In and Sign Up forms
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { fetchPublicTemplates, type PublicTemplate } from '../lib/publicTemplates';
import { MarketingShell, MarketingSection } from './marketing/MarketingShell';
import { MarketingNav } from './marketing/MarketingNav';
import { MarketingFooter } from './marketing/MarketingFooter';
import { EditorMockStrip } from './marketing/EditorMockStrip';

export function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

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

  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND !== 'true') return;
    let cancelled = false;

    async function load() {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const res = await fetchPublicTemplates({ limit: 6, orderBy: 'recent' });
        if (!cancelled) setTemplates(res);
      } catch (e) {
        if (!cancelled) setTemplatesError('Failed to load public templates.');
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loginOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLoginOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [loginOpen]);

  if (showSignUp) {
    return <SignUpPage onBackToSignIn={() => setShowSignUp(false)} />;
  }

  return (
    <MarketingShell>
      <MarketingNav
        active="explore"
        onSignInClick={() => setLoginOpen(true)}
      />

      <main className="relative z-10">
        <div className="marketing-hero">
          <div className="marketing-eyebrow">WebXR Development Platform</div>
          <h1 className="marketing-title">
            Code, preview &amp; publish
            <br />
            <span className="brand">WebXR experiences</span>
            <br />
            in your browser
          </h1>
          <p className="marketing-subtitle">
            Sign in to your workspace, or try public templates instantly in the playground. Everything runs in the browser.
          </p>
          <div className="marketing-ctas">
            <a
              href="#"
              className="marketing-cta marketing-cta-green"
              onClick={(e) => {
                e.preventDefault();
                setLoginOpen(true);
              }}
            >
              Sign In to Your Workspace
            </a>
            {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' ? (
              <a href="#templates" className="marketing-cta marketing-cta-orange">
                ⚡ Try templates
              </a>
            ) : (
              <a href="/about" className="marketing-cta marketing-cta-ghost">
                Learn more
              </a>
            )}
          </div>
        </div>

        <EditorMockStrip />

        {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' ? (
          <MarketingSection id="templates">
            <div className="marketing-section-head">
              <span className="marketing-section-title">Public Templates — No Sign-In Required</span>
              <a href="/playground" className="marketing-section-link">
                View all →
              </a>
            </div>

            {templatesError ? (
              <div className="marketing-form-card" role="alert">
                <div className="marketing-help" style={{ textAlign: 'left' }}>
                  {templatesError}
                </div>
              </div>
            ) : null}

            {templatesLoading ? (
              <div className="marketing-help">Loading templates…</div>
            ) : templates.length === 0 ? (
              <div className="marketing-help">No public templates are available yet.</div>
            ) : (
              <div className="marketing-tgrid">
                {templates.map((t) => (
                  <a key={t.id} href={`/play/${t.id}?source=storage`} className="marketing-tcard">
                    <div className={['marketing-tthumb', t.thumbnailUrl ? 'has-image' : undefined].filter(Boolean).join(' ')}>
                      {t.thumbnailUrl ? <img src={t.thumbnailUrl} alt={t.name} loading="lazy" /> : <span>💻</span>}
                    </div>
                    <div className="marketing-tbody">
                      <div className="marketing-ttitle">{t.name}</div>
                      <div className="marketing-tid">{t.id}</div>
                      {t.description ? <div className="marketing-tdesc">{t.description}</div> : null}
                      <span className="marketing-topen">Open in Playground</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </MarketingSection>
        ) : null}
      </main>

      <MarketingFooter />

      {loginOpen ? (
        <div
          className="marketing-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sign In"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
        >
          <div className="marketing-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="marketing-modal-head">
              <div>
                <div className="marketing-modal-title">Sign In</div>
                <div className="marketing-help" style={{ textAlign: 'left', marginTop: 6 }}>
                  Use your account to access your workspace.
                </div>
              </div>
              <button className="marketing-modal-x" type="button" onClick={() => setLoginOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div
              style={{
                background: 'rgba(249, 115, 22, 0.10)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div className="marketing-section-title" style={{ marginBottom: 8, fontSize: '0.75rem' }}>
                Testing Mode — Quick Sign In
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@webxride.com');
                    setPassword('test');
                  }}
                  className="marketing-btn marketing-btn-ghost"
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  👤 Admin (unlimited storage)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('student@webxride.com');
                    setPassword('test');
                  }}
                  className="marketing-btn marketing-btn-ghost"
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  🎓 Student (1GB storage, 500 files)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('free@webxride.com');
                    setPassword('test');
                  }}
                  className="marketing-btn marketing-btn-ghost"
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  🆓 Free User (100MB, 50 files)
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                handleSubmit(e);
              }}
            >
              <div className="marketing-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="marketing-input"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="marketing-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="marketing-input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              {error ? (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.10)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 8,
                    padding: '0.75rem',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    marginBottom: '0.85rem',
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#fca5a5', marginTop: 2 }} />
                  <div style={{ color: '#fecaca', fontSize: '0.9rem', lineHeight: 1.4 }}>{error}</div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="marketing-cta marketing-cta-green"
                style={{ width: '100%', textAlign: 'center' }}
              >
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <LogIn size={18} />
                  {loading ? 'Signing in…' : 'Sign In'}
                </span>
              </button>
            </form>

            <div className="marketing-help" style={{ marginTop: '0.9rem' }}>
              Need access? Contact the administrator of this instance.
              {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' ? (
                <div style={{ marginTop: 8 }}>
                  Or <a href="/playground" style={{ color: 'var(--m-green)', textDecoration: 'none', fontWeight: 700 }}>try public templates</a>.
                </div>
              ) : null}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="marketing-btn marketing-btn-ghost" onClick={() => setShowSignUp(true)}>
                  Create an account →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </MarketingShell>
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

