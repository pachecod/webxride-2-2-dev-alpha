import React from 'react';

export function MarketingFooter({
  rightText = 'Built for the WebXR community',
  footerHtml,
}: {
  rightText?: string;
  footerHtml?: string;
}) {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container marketing-footer-inner">
        <span className="marketing-footer-brand">WebXRide</span>
        <ul className="marketing-footer-links">
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/terms">Terms of Use</a>
          </li>
          <li>
            <a href="/privacy-policy">Privacy Policy</a>
          </li>
        </ul>
        <span className="marketing-footer-copy">{rightText}</span>
      </div>
      {footerHtml ? (
        <div className="marketing-container marketing-footer-html">
          <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
        </div>
      ) : null}
    </footer>
  );
}

