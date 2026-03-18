import React, { useEffect, useState } from 'react';
import { fetchPublicTemplates, type PublicTemplate } from '../lib/publicTemplates';
import { MarketingShell, MarketingSection } from './marketing/MarketingShell';
import { MarketingNav } from './marketing/MarketingNav';
import { MarketingFooter } from './marketing/MarketingFooter';

export const PublicGallery: React.FC = () => {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPublicTemplates({ limit: 1000, orderBy: 'adminOrder' });
        setTemplates(result);
      } catch (e) {
        setError('Failed to load public templates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <MarketingShell>
      <MarketingNav active="templates" />

      <main className="relative z-10">
        <div className="marketing-hero">
          <div className="marketing-eyebrow">Public Templates</div>
          <h1 className="marketing-title">
            Try starters in the <span className="brand">Public Playground</span>
          </h1>
          <p className="marketing-subtitle">
            Browse templates shared publicly. Click any template to open it in the playground and experiment locally.
          </p>
          <div className="marketing-ctas">
            <a href="/" className="marketing-cta marketing-cta-ghost">
              ← Back to sign in
            </a>
          </div>
        </div>

        <MarketingSection id="templates">
          <div className="marketing-section-head">
            <span className="marketing-section-title">Templates</span>
            <a className="marketing-section-link" href="/about">
              About →
            </a>
          </div>

          {error ? (
            <div className="marketing-form-card" role="alert">
              <div className="marketing-help" style={{ textAlign: 'left' }}>
                {error}
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="marketing-help">Loading…</div>
          ) : templates.length === 0 ? (
            <div className="marketing-help">No public templates available yet.</div>
          ) : (
            <div className="marketing-tgrid">
              {templates.map(t => (
                <a key={t.id} href={`/play/${t.id}?source=storage`} className="marketing-tcard" title={t.name}>
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
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
};

export default PublicGallery;


