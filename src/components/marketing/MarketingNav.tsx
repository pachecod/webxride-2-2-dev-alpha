import React from 'react';

type MarketingNavProps = {
  active?: 'explore' | 'templates' | 'about';
  onSignInClick?: () => void;
  rightCtaLabel?: string;
  rightCtaHref?: string;
};

export function MarketingNav({
  active = 'explore',
  onSignInClick,
  rightCtaLabel = 'Open Editor →',
  rightCtaHref,
}: MarketingNavProps) {
  const handleSignIn = (e: React.MouseEvent) => {
    if (!onSignInClick) return;
    e.preventDefault();
    onSignInClick();
  };

  return (
    <nav className="marketing-nav">
      <a href="/" className="marketing-nav-brand">
        <span className="marketing-nav-logo" aria-hidden>
          <span className="marketing-nav-logo-icon">🚗</span>
        </span>
        <span className="marketing-nav-name">WebXRide</span>
      </a>

      <ul className="marketing-nav-links">
        <li>
          <a href="/" className={active === 'explore' ? 'active' : undefined}>
            Explore
          </a>
        </li>
        <li>
          <a href="/playground" className={active === 'templates' ? 'active' : undefined}>
            Templates
          </a>
        </li>
        <li>
          <a href="/about" className={active === 'about' ? 'active' : undefined}>
            About
          </a>
        </li>
      </ul>

      <div className="marketing-nav-actions">
        <a href="#signin" className="marketing-btn marketing-btn-ghost" onClick={handleSignIn}>
          Sign In
        </a>
        {rightCtaHref ? (
          <a href={rightCtaHref} className="marketing-btn marketing-btn-green">
            {rightCtaLabel}
          </a>
        ) : (
          <a href="#signin" className="marketing-btn marketing-btn-green" onClick={handleSignIn}>
            {rightCtaLabel}
          </a>
        )}
      </div>
    </nav>
  );
}

