import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { newsQuery } from "@/lib/queries";
import { NewsCover, fmtNewsDate } from "@/components/site/NewsList";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/lib/content.functions";

export const Route = createFileRoute("/news/")({
  head: () => ({ meta: [
    { title: "News — Buruj Sports Academy" },
    { name: "description", content: "Latest headlines, match reports, trials and academy announcements from Buruj Sports Academy, Ikorodu." },
    { property: "og:title", content: "Buruj Sports Academy News" },
    { property: "og:description", content: "Headlines, match reports and announcements from Buruj." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery),
  errorComponent: () => <p className="p-16 text-center text-muted-foreground">Could not load news. Please refresh.</p>,
  component: NewsPage,
});

function Meta({ n, light }: { n: NewsItem; light?: boolean }) {
  return <p className={cn("text-xs font-bold uppercase tracking-wider", light ? "text-gold" : "text-primary")}>{n.category}<span className={light ? "text-navy-foreground/70" : "text-muted-foreground"}> · {fmtNewsDate(n.published_at)}</span></p>;
}

function NewsPage() {
  const { data } = useSuspenseQuery(newsQuery);
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set(data.map((n) => n.category))], [data]);
  const list = data.filter((n) => cat === "All" || n.category === cat);
  const lead = list.find((n) => n.is_featured) ?? list[0];
  const rest = list.filter((n) => n !== lead);
  const side = rest.slice(0, 3);
  const grid = rest.slice(3);
  const latest = data.slice(0, 6);

  return (
    <div className="bg-background">
      <div className="border-b bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden px-4 py-2 text-sm sm:px-6">
          <span className="shrink-0 rounded bg-gold px-2 py-0.5 font-display font-bold uppercase text-gold-foreground">Latest</span>
          <p className="truncate">{latest.map((n) => n.title).join("  •  ") || "No headlines yet"}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-navy pb-3">
          <h1 className="text-5xl font-extrabold uppercase leading-none text-navy sm:text-6xl">Buruj News</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b py-2">
          {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide", cat === c ? "bg-navy text-navy-foreground" : "text-navy hover:bg-secondary")}>{c}</button>)}
        </nav>

        {!lead ? <p className="py-16 text-center text-muted-foreground">News updates are coming soon.</p> : (
          <>
            <section className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
              <Link to="/news/$slug" params={{ slug: lead.slug }} className="group relative block aspect-[16/10] overflow-hidden rounded-lg">
                <NewsCover src={lead.cover_url} title={lead.title} className="transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                <div className="absolute bottom-0 p-6 text-navy-foreground sm:p-8">
                  <Meta n={lead} light />
                  <h2 className="mt-2 text-3xl font-extrabold uppercase leading-tight sm:text-5xl">{lead.title}</h2>
                  {lead.excerpt && <p className="mt-3 line-clamp-2 max-w-2xl text-navy-foreground/85">{lead.excerpt}</p>}
                </div>
              </Link>
              <div className="divide-y">
                <p className="pb-2 font-display text-lg font-bold uppercase text-navy">Top stories</p>
                {side.map((n) => (
                  <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group flex gap-4 py-4">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded"><NewsCover src={n.cover_url} title={n.title} /></div>
                    <div><Meta n={n} /><h3 className="mt-1 font-display text-lg font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</h3></div>
                  </Link>
                ))}
                {side.length === 0 && <p className="py-4 text-sm text-muted-foreground">More stories coming soon.</p>}
              </div>
            </section>

            {grid.length > 0 && (
              <section className="mt-12">
                <h2 className="border-b-2 border-gold pb-2 font-display text-2xl font-bold uppercase text-navy">More news</h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {grid.map((n) => (
                    <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group">
                      <div className="aspect-video overflow-hidden rounded"><NewsCover src={n.cover_url} title={n.title} className="transition-transform group-hover:scale-105" /></div>
                      <div className="mt-3"><Meta n={n} /><h3 className="mt-1 font-display text-xl font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</h3>{n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
