import React, { useState, useEffect, useRef } from 'react';
import { getAboutPage, AboutPage } from '../lib/supabase';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { MarketingShell } from './marketing/MarketingShell';
import { MarketingNav } from './marketing/MarketingNav';
import { MarketingFooter } from './marketing/MarketingFooter';

interface AboutPageProps {
  onEdit?: () => void;
  isAdmin?: boolean;
}

export const AboutPageComponent: React.FC<AboutPageProps> = ({ onEdit, isAdmin = false }) => {
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(600);

  useEffect(() => {
    loadAboutPage();
  }, []);

  const loadAboutPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getAboutPage();
      setAboutPage(page);
    } catch (err) {
      console.error('Error loading about page:', err);
      setError('Failed to load about page content');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const body = doc.body;
      const html = doc.documentElement;
      const height = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        html?.clientHeight || 0,
        html?.scrollHeight || 0,
        html?.offsetHeight || 0
      );
      if (height > 0) {
        // Add a little padding
        setIframeHeight(height + 24);
      }
    } catch (e) {
      console.error('Failed to auto-size about page iframe:', e);
    }
  };

  if (loading) {
    return (
      <MarketingShell>
        <MarketingNav
          active="about"
          rightCtaLabel="Home →"
          rightCtaHref="/"
          onSignInClick={() => {
            window.location.href = '/#signin';
          }}
        />
        <main className="relative z-10">
          <div className="marketing-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <div className="marketing-form-card">
              <div className="marketing-help" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={18} />
                <span>Loading about page…</span>
              </div>
            </div>
          </div>
        </main>
        <MarketingFooter />
      </MarketingShell>
    );
  }

  if (error) {
    return (
      <MarketingShell>
        <MarketingNav
          active="about"
          rightCtaLabel="Home →"
          rightCtaHref="/"
          onSignInClick={() => {
            window.location.href = '/#signin';
          }}
        />
        <main className="relative z-10">
          <div className="marketing-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <div className="marketing-form-card" role="alert">
              <div className="marketing-help" style={{ textAlign: 'left', color: '#fecaca' }}>
                {error}
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={loadAboutPage} className="marketing-btn marketing-btn-green" type="button">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <MarketingFooter />
      </MarketingShell>
    );
  }

  if (!aboutPage) {
    return (
      <MarketingShell>
        <MarketingNav
          active="about"
          rightCtaLabel="Home →"
          rightCtaHref="/"
          onSignInClick={() => {
            window.location.href = '/#signin';
          }}
        />
        <main className="relative z-10">
          <div className="marketing-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <div className="marketing-form-card">
              <div className="marketing-help" style={{ textAlign: 'left' }}>
                About page content not found.
              </div>
              {isAdmin && onEdit ? (
                <div style={{ marginTop: 12 }}>
                  <button onClick={onEdit} className="marketing-btn marketing-btn-green" type="button">
                    Create About Page
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
        <MarketingFooter />
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <MarketingNav
        active="about"
        rightCtaLabel="Home →"
        rightCtaHref="/"
        onSignInClick={() => {
          window.location.href = '/#signin';
        }}
      />

      <main className="relative z-10">
        <div className="marketing-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  type="button"
                >
                  <ArrowLeft size={20} />
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{aboutPage.title}</h1>
              </div>
              {isAdmin && onEdit ? (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              ) : null}
            </div>

          <iframe
            ref={iframeRef}
            srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aboutPage.title}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #ffffff; }
    h1, h2, h3, h4, h5, h6 { color: #111827; }
    p, li { color: #111827; line-height: 1.6; }
    a { color: #2563eb; }
    ${aboutPage.css_content || ''}
  </style>
</head>
<body>
  ${aboutPage.content}
</body>
</html>`}
            style={{ width: '100%', border: '0', height: `${iframeHeight}px` }}
            onLoad={handleIframeLoad}
            title="About Page"
          />
          </div>
        
          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p className="bg-white inline-block rounded px-3 py-2 border border-gray-200">
              Last updated: {new Date(aboutPage.updated_at).toLocaleDateString()} at{' '}
              {new Date(aboutPage.updated_at).toLocaleTimeString()}
              {aboutPage.updated_by && ` by ${aboutPage.updated_by}`}
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
};

export default AboutPageComponent; 