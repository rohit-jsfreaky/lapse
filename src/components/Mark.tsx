/** The Lapse mark: a time-left bar running out. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--ink)" />
      <rect x="5" y="10" width="14" height="4" rx="2" fill="#4a3d5c" />
      <rect x="5" y="10" width="9" height="4" rx="2" fill="#b8a6f0" />
      <path d="M14 6.5v11" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
