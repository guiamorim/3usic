// Small inline icons (no icon font or external requests). Decorative: aria-hidden.
const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const IconHome = () => (
  <svg {...common}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);
export const IconBook = () => (
  <svg {...common}>
    <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" />
    <path d="M4 5v16" />
  </svg>
);
export const IconTarget = () => (
  <svg {...common}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconGrid = () => (
  <svg {...common}>
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M9 3v18M13 3v18M5 8h14M5 13h14" />
  </svg>
);
export const IconTools = () => (
  <svg {...common}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
export const IconMusic = () => (
  <svg {...common}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </svg>
);
export const IconStrum = () => (
  <svg {...common}>
    <path d="M7 4v12M4 13l3 3 3-3" />
    <path d="M17 20V8M14 11l3-3 3 3" />
  </svg>
);
