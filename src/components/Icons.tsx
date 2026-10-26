// Small inline icons (no icon font or external requests). Decorative: aria-hidden.
const common = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

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
export const IconMore = () => (
  <svg {...common}>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);
export const IconTuner = () => (
  <svg {...common}>
    <path d="M4 16a8 8 0 0116 0" />
    <path d="M12 16l4-6" />
    <path d="M4 20h16" />
  </svg>
);
export const IconMetronome = () => (
  <svg {...common}>
    <path d="M9 3h6l4 18H5z" />
    <path d="M12 16l5-9" />
  </svg>
);
export const IconChart = () => (
  <svg {...common}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16l4-5 3 3 5-7" />
  </svg>
);
export const IconFlame = () => (
  <svg {...common}>
    <path d="M12 21a6 6 0 006-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-3 5-3 8a6 6 0 006 6z" />
  </svg>
);
export const IconRepeat = () => (
  <svg {...common}>
    <path d="M17 2l3 3-3 3" />
    <path d="M4 11V9a4 4 0 014-4h12" />
    <path d="M7 22l-3-3 3-3" />
    <path d="M20 13v2a4 4 0 01-4 4H4" />
  </svg>
);
export const IconHand = () => (
  <svg {...common}>
    <path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V5.5a1.5 1.5 0 013 0V14a7 7 0 01-7 7h-.5A5.5 5.5 0 014 15.5V12a1.5 1.5 0 013 0v2" />
  </svg>
);
export const IconSave = () => (
  <svg {...common}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v5h7V3M8 21v-7h8v7" />
  </svg>
);
export const IconUser = () => (
  <svg {...common}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0116 0" />
  </svg>
);
export const IconShield = () => (
  <svg {...common}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
);
export const IconCheck = () => (
  <svg {...common}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);
