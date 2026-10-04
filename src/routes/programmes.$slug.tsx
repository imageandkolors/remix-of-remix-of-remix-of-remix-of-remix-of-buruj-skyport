import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Globe } from "lucide-react";
import { programmeQuery } from "@/lib/queries";
import { formatFee } from "@/lib/programmes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/programmes/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(programmeQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name, tagline: p.tagline };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Programme not found — Buruj Sports Academy" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.name} — Buruj Sports Academy`;
    const d = loaderData.tagline ?? `Details, fees and inclusions for ${loaderData.name}.`;
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  errorComponent: () => <p className="p-16 text-center text-muted-foreground">Could not load this programme. Please refresh.</p>,
  notFoundComponent: ProgrammeNotFound,
  component: ProgrammePage,
});

function ProgrammeNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold uppercase text-navy">Programme not found</h1>
      <Button asChild className="mt-6"><Link to="/admissions">See admissions</Link></Button>
    </div>
  );
}

function ProgrammePage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(programmeQuery(slug));
  if (!p) return null;
  return (
    <div>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="font-display font-bold uppercase tracking-widest text-gold">{[p.age_range, p.session_label].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-2 text-5xl font-extrabold uppercase sm:text-6xl">{p.name}</h1>
          {p.tagline && <p className="mt-4 max-w-2xl text-lg opacity-85">{p.tagline}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-gold px-5 py-2 font-display text-xl font-bold text-gold-foreground">{formatFee(p)}</span>
            {p.non_refundable && <span className="text-sm opacity-75">Fees are non-refundable</span>}
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          {p.intro && <p className="text-lg leading-relaxed">{p.intro}</p>}
          {p.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-3xl font-extrabold uppercase text-navy">{s.title}</h2>
              {s.body && <p className="mt-2 text-muted-foreground">{s.body}</p>}
              {s.items.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {s.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" />{i}</li>)}
                </ul>
              )}
            </section>
          ))}
          {p.trial_countries.length > 0 && (
            <section>
              <h2 className="text-3xl font-extrabold uppercase text-navy">Trial destinations</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.trial_countries.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full bg-sky px-4 py-1 font-display font-semibold text-navy"><Globe className="h-4 w-4" />{c}</span>)}
              </div>
            </section>
          )}
          {p.note && <p className="rounded-lg border-l-4 border-gold bg-secondary p-4 text-sm">{p.note}</p>}
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-2xl font-extrabold uppercase text-navy">What's included</h3>
            <ul className="mt-4 space-y-2">{p.inclusions.map((i) => <li key={i} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" />{i}</li>)}</ul>
          </div>
          <div className="rounded-xl bg-navy p-6 text-navy-foreground">
            <h3 className="text-2xl font-extrabold uppercase">{p.cta_title ?? "Ready to join?"}</h3>
            {p.cta_body && <p className="mt-2 opacity-85">{p.cta_body}</p>}
            <Button asChild className="mt-4 w-full bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"><Link to="/apply">{p.cta_label ?? "Apply now"}</Link></Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
