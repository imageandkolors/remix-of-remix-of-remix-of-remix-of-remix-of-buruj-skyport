export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-sm bg-navy font-display text-[11px] font-black tracking-tight text-gold ring-1 ring-gold/40`}
      aria-label="Buruj Sports Academy crest"
    >
      BSA
    </div>
  );
}
