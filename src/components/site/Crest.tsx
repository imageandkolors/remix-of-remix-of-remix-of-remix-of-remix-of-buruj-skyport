export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <path d="M24 2 L46 10 V28 C46 42 36 50 24 54 C12 50 2 42 2 28 V10 Z" className="fill-navy stroke-gold" strokeWidth="2.5" />
      <path d="M24 9 L39 14.5 V28 C39 38 32 44 24 47 C16 44 9 38 9 28 V14.5 Z" className="fill-sky" />
      <text x="24" y="34" textAnchor="middle" className="fill-navy" style={{ font: "800 15px 'Barlow Condensed', sans-serif" }}>BSA</text>
    </svg>
  );
}
