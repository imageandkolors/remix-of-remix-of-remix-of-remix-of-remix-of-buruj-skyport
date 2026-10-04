import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, GraduationCap, Tent, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, SectionHeading } from "./Reveal";
import { FEE_PLACEHOLDER } from "@/lib/site";
import { cn } from "@/lib/utils";

export type Programme = {
  slug: string;
  name: string;
  age_range: string | null;
  fee_amount: number | null;
  fee_period: string | null;
  fee_confirmed: boolean;
  inclusions: string[];
};

const EXTRA: Record<string, { icon: typeof Check; tagline: string; pathway: string[] }> = {
  "play-study": {
    icon: GraduationCap,
    tagline: "Full secondary schooling with elite residential football.",
    pathway: ["Assessment & admission", "Term-time academics + training", "Squad selection & league matches", "International trial showcase"],
  },
  "football-camping": {
    icon: Tent,
    tagline: "Intensive residential football for dedicated players.",
    pathway: ["Trial match registration", "Residential camp training", "Performance evaluation", "International trial showcase"],
  },
  "football-education": {
    icon: GraduationCap,
    tagline: "Full secondary schooling with elite residential football.",
    pathway: ["Assessment & admission", "Term-time academics + training", "Squad selection & league matches", "International trial showcase"],
  },
  "football-development": {
    icon: Trophy,
    tagline: "Full-season development, competition and scouting exposure.",
    pathway: ["Enrollment & assessment", "Season-long development & tournaments", "Scout showcase events", "NLO pathway recommendation"],
  },
};

export function formatFee(p: Programme) {
  if (!p.fee_confirmed || p.fee_amount == null) return FEE_PLACEHOLDER;
  return `₦${Number(p.fee_amount).toLocaleString()} / ${p.fee_period ?? "year"}`;
}

export function Programmes({ programmes }: { programmes: Programme[] }) {
  const [tab, setTab] = useState<"inclusions" | "pathway">("inclusions");
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading eyebrow="Programmes" title="Choose your game plan" intro="Three residential pathways — all leading to our international trial showcase." />
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["inclusions", "pathway"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 font-display font-bold uppercase tracking-wide transition-colors", tab === t ? "bg-navy text-navy-foreground" : "text-navy hover:text-primary")}>
              {t === "inclusions" ? "What's included" : "Trial pathway"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {programmes.map((p, idx) => {
          const x = EXTRA[p.slug];
          const Icon = x?.icon ?? Check;
          return (
            <Reveal key={p.slug} delay={idx * 120}>
              <article className="glow-hover flex h-full flex-col overflow-hidden rounded-xl border bg-card">
                <div className={cn("p-8", idx === 0 ? "bg-navy text-navy-foreground" : "bg-sky text-navy")}>
                  <Icon className={cn("h-9 w-9", idx === 0 ? "text-gold" : "text-navy")} />
                  <h3 className="mt-4 text-4xl font-extrabold uppercase">{p.name}</h3>
                  <p className="font-display text-lg font-semibold uppercase tracking-wider opacity-80">{p.age_range}</p>
                  <p className="mt-2 opacity-85">{x?.tagline}</p>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  {tab === "inclusions" ? (
                    <ul className="space-y-3">
                      {p.inclusions.map((inc) => (
                        <li key={inc} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-primary" />{inc}</li>
                      ))}
                    </ul>
                  ) : (
                    <ol className="space-y-3">
                      {x?.pathway.map((step, i) => (
                        <li key={step} className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold font-display font-bold text-gold-foreground">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t pt-6 mt-8">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Annual fee</p>
                      <p className="font-display text-xl font-bold text-navy">{formatFee(p)}</p>
                    </div>
                    <Button asChild className="font-display font-bold uppercase">
                      <Link to="/admissions">Apply now</Link>
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
