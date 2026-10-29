import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Globe } from "lucide-react";
import { programmesQuery } from "@/lib/queries";
import { formatFee } from "@/lib/programmes";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/programmes/")({
  head: () => ({
    meta: [
      { title: "All Programmes — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "Compare Football & Education, Football Development and Football Camping at Buruj Sports Academy: ages, fees, inclusions and trial pathways.",
      },
      { property: "og:title", content: "Buruj Programmes — Choose Your Pathway" },
      {
        property: "og:description",
        content: "Every Buruj programme side by side with fees and inclusions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(programmesQuery),
  errorComponent: () => (
    <p className="p-16 text-center text-muted-foreground">
      Could not load programmes. Please refresh.
    </p>
  ),
  component: ProgrammesHub,
});

function ProgrammesHub() {
  const { data } = useSuspenseQuery(programmesQuery);
  return (
    <>
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">
            Programmes
          </p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">
            Choose your pathway
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/80">
            Residential programmes built around certified coaching, welfare and international
            exposure.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3">
        {data.length === 0 && (
          <p className="text-muted-foreground">Programmes will be listed soon.</p>
        )}
        {data.map((p, i) => (
          <Reveal key={p.slug} delay={i * 100}>
            <article className="glow-hover flex h-full flex-col overflow-hidden rounded-xl border bg-card">
              <div className="border-b-4 border-gold bg-navy p-7 text-navy-foreground">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-gold">
                  {[p.age_range, p.session_label].filter(Boolean).join(" · ")}
                </p>
                <h2 className="mt-2 text-4xl font-extrabold uppercase leading-none">{p.name}</h2>
                {p.tagline && <p className="mt-3 opacity-80">{p.tagline}</p>}
              </div>
              <div className="flex flex-1 flex-col p-7">
                <ul className="space-y-2">
                  {p.inclusions.slice(0, 6).map((x) => (
                    <li key={x} className="flex gap-2">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      {x}
                    </li>
                  ))}
                </ul>
                {p.trial_countries.length > 0 && (
                  <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0 text-primary" />
                    Trials: {p.trial_countries.join(", ")}
                  </p>
                )}
                <div className="mt-auto pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Fees</p>
                  <p className="font-display text-2xl font-bold text-navy">{formatFee(p)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild className="font-display font-bold uppercase">
                      <Link to="/programmes/$slug" params={{ slug: p.slug }}>
                        Full details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="font-display font-bold uppercase">
                      <Link to="/apply" search={{ programme: p.name }}>
                        Apply
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}
