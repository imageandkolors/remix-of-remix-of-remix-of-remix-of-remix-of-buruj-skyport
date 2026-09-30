import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, intro, light }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
      <h2 className={cn("mt-2 text-4xl font-extrabold uppercase leading-none sm:text-5xl", light ? "text-navy-foreground" : "text-navy")}>{title}</h2>
      {intro && <p className={cn("mt-4 text-lg", light ? "text-navy-foreground/75" : "text-muted-foreground")}>{intro}</p>}
    </Reveal>
  );
}
