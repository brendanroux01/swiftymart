type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const CartIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6" />
    <circle cx="10" cy="20.5" r="1.3" />
    <circle cx="17" cy="20.5" r="1.3" />
  </svg>
);
export const SearchIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);
export const ShieldIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const TruckIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M1 6h13v10H1z" />
    <path d="M14 9h4l3 3v4h-7z" />
    <circle cx="5.5" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </svg>
);
export const CardIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </svg>
);
export const PhoneIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);
export const BoltIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
  </svg>
);
export const GamepadIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L13.5 14h-3L9 15.6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z" />
    <line x1="7" y1="10.5" x2="7" y2="13.5" />
    <line x1="5.5" y1="12" x2="8.5" y2="12" />
    <circle cx="16" cy="11" r="0.8" />
    <circle cx="18" cy="13" r="0.8" />
  </svg>
);
export const ImageIcon = ({ size = 36, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
);
export const TrashIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
  </svg>
);

export function CategoryIcon({ slug, size = 28 }: { slug: string; size?: number }) {
  if (slug === "backup-power") return <BoltIcon size={size} />;
  if (slug === "gaming-gear") return <GamepadIcon size={size} />;
  return <PhoneIcon size={size} />;
}
