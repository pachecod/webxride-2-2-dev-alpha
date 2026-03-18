import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import webxrideLogo from '../assets/webxride-logo.png';
import { getAdminSettings } from '../lib/supabase';
import { fetchPublicTemplates, type PublicTemplate } from '../lib/publicTemplates';
import { MarketingShell, MarketingSection } from './marketing/MarketingShell';
import { MarketingNav } from './marketing/MarketingNav';
import { MarketingFooter } from './marketing/MarketingFooter';
import { EditorMockStrip } from './marketing/EditorMockStrip';

interface SimpleLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export const SimpleLogin: React.FC<SimpleLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [footerHtml, setFooterHtml] = useState<string>('');

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
        const topFour = await fetchPublicTemplates({ limit: 4, orderBy: 'recent' });
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

  // Load editable footer HTML from admin settings
  useEffect(() => {
    const loadFooter = async () => {
      try {
        const settings = await getAdminSettings();
        setFooterHtml(settings.main_footer_html || '');
      } catch (error) {
        console.error('Failed to load footer HTML from admin settings:', error);
      }
    };
    loadFooter();
  }, []);

  useEffect(() => {
    if (!loginOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLoginOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [loginOpen]);

  return (
    <MarketingShell>
      <MarketingNav active="explore" onSignInClick={() => setLoginOpen(true)} />

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
            A full development environment for WebXR projects — plus public templates you can try instantly.
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
                ⚡ Try public templates
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
              <a className="marketing-section-link" href="/playground">
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

      <MarketingFooter footerHtml={footerHtml} />

      {loginOpen ? (
        <div
          className="marketing-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Log In"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
        >
          <div className="marketing-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="marketing-modal-head">
              <div>
                <div className="marketing-modal-title">Log In</div>
                <div className="marketing-help" style={{ textAlign: 'left', marginTop: 6 }}>
                  Enter your username and password.
                </div>
              </div>
              <button className="marketing-modal-x" type="button" onClick={() => setLoginOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="text-center" style={{ marginBottom: '1rem' }}>
              <img
                src={webxrideLogo}
                alt="WebXRide Logo"
                className="mx-auto"
                style={{ width: 56, height: 56, borderRadius: 9999, background: '#fff', padding: 8 }}
              />
            </div>

            {error ? (
              <div className="marketing-help" role="alert" style={{ color: '#fecaca', marginBottom: '0.75rem', textAlign: 'left' }}>
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div className="marketing-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="marketing-input"
                  placeholder="Enter your username"
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
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} className="marketing-cta marketing-cta-green" style={{ width: '100%', textAlign: 'center' }}>
                {loading ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: 9999, border: '2px solid rgba(0,0,0,0.35)', borderTopColor: 'rgba(0,0,0,0.85)' }} />
                    Logging in…
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <LogIn className="h-4 w-4" />
                    Log In
                  </span>
                )}
              </button>
            </form>

            <div className="marketing-help" style={{ marginTop: '0.9rem', textAlign: 'left' }}>
              Don&apos;t have a password? Contact the administrator of this instance.
              {import.meta.env.VITE_ENABLE_PUBLIC_PLAYGROUND === 'true' ? (
                <div style={{ marginTop: 8 }}>
                  Or <a href="/playground" style={{ color: 'var(--m-green)', textDecoration: 'none', fontWeight: 700 }}>try public templates</a>.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </MarketingShell>
  );
};


