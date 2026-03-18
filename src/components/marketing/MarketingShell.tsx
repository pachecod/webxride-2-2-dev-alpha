import React from 'react';

type MarketingShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function MarketingShell({ children, className }: MarketingShellProps) {
  return (
    <div className={['marketing', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function MarketingSection({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={['marketing-section', className].filter(Boolean).join(' ')}>
      <div className="marketing-container">{children}</div>
    </section>
  );
}

