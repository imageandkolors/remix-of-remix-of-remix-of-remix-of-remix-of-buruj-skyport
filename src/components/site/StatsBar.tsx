import { useEffect, useRef, useState } from "react";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / 1400, 1);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const years = new Date().getFullYear() - 2013;
  const stats = [
    { value: <Counter to={years} suffix="+" />, label: "Years of excellence", sub: "Est. 2013" },
    { value: "24/7", label: "Residential boarding", sub: "Dedicated welfare team" },
    { value: <Counter to={3} />, label: "Trial showcase countries", sub: "UK · Spain · Italy" },
    { value: "NFF", label: "Certified coaching", sub: "NFF / LSFA / FIFA certificates" },
  ];
  return (
    <section className="relative z-10 -mt-12 px-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-xl border-t-4 border-gold bg-card shadow-2xl md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="border-border p-6 text-center [&:not(:last-child)]:md:border-r">
            <p className="font-display text-5xl font-extrabold text-primary">{s.value}</p>
            <p className="mt-1 font-display text-lg font-bold uppercase text-navy">{s.label}</p>
            <p className="text-sm text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
