import { useEffect, useState } from 'react';

/** Minimal hash router: works offline, on any static host and inside an installed PWA. */
export function parseHash(hash: string): string[] {
  const path = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  return path
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
}

export function useRoute(): string[] {
  const [segments, setSegments] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setSegments(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return segments;
}

export function navigate(path: string): void {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash !== target) window.location.hash = target;
}

export function href(...segments: string[]): string {
  return `#/${segments.map(encodeURIComponent).join('/')}`;
}
