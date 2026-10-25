import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}

/** Page shell: sets the document title and moves focus to the heading on navigation. */
export function Page({ title, subtitle, back, children }: Props) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · Braço`;
    h1.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [title]);
  return (
    <>
      {back && (
        <a className="back-link" href={back.href}>
          ← {back.label}
        </a>
      )}
      <h1 ref={h1} tabIndex={-1} className="page-title">
        {title}
      </h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}%`}>
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
