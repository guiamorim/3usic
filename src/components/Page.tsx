import { useEffect, useRef, useState, type ReactNode } from 'react';
import { previousEntry, takeRestore } from '../app/navTrail';

interface Props {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}

/**
 * Page shell: sets the document title, moves focus to the heading on navigation and restores the
 * scroll position when coming back. «← voltar» goes to the screen the user came from, if any.
 */
export function Page({ title, subtitle, back: fallback, children }: Props) {
  const h1 = useRef<HTMLHeadingElement>(null);
  // Read once per screen: the trail changes as soon as the user navigates away.
  const [origin] = useState(previousEntry);
  const back = fallback && origin ? { href: origin.hash, label: origin.title || fallback.label } : fallback;
  useEffect(() => {
    document.title = `${title} · Braço`;
    h1.current?.focus({ preventScroll: true });
    const y = takeRestore();
    window.scrollTo({ top: y ?? 0 });
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
