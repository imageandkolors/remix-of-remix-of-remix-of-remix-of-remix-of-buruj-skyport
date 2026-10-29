import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { newsQuery } from "@/lib/queries";
import { NewsCover, fmtNewsDate } from "@/components/site/NewsList";
import { AdSlot, SITE_URL, readingMinutes } from "@/components/site/NewsExtras";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/lib/content.functions";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "Latest headlines, match reports, trials and academy announcements from Buruj Sports Academy, Ikorodu, Lagos.",
      },
      { property: "og:title", content: "Buruj Sports Academy News" },
      {
        property: "og:description",
        content: "Headlines, match reports and announcements from Buruj Sports Academy.",
      },
      { property: "og:url", content: `${SITE_URL}/news` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/news` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Buruj Sports Academy News",
          url: `${SITE_URL}/news`,
        }),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery),
  errorComponent: () => (
    <p className="p-16 text-center text-muted-foreground">Could not load news. Please refresh.</p>
  ),
  component: NewsPage,
});

function Meta({ n, light }: { n: NewsItem; light?: boolean }) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-wider",
        light ? "text-gold" : "text-primary",
      )}
    >
      {n.category}
      <span className={light ? "text-navy-foreground/70" : "text-muted-foreground"}>
        {" "}
        · {fmtNewsDate(n.published_at)} · {readingMinutes(n.body)} min read
      </span>
    </p>
  );
}

function NewsPage() {
  const { data } = useSuspenseQuery(newsQuery);
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set(data.map((n) => n.category))], [data]);
  const list = data.filter((n) => cat === "All" || n.category === cat);
  const lead = list.find((n) => n.is_featured) ?? list[0];
  const rest = list.filter((n) => n !== lead);
  const second = rest.slice(0, 2);
  const grid = rest.slice(2);
  const mostRead = data.slice(0, 5);
  const ticker = data.slice(0, 8);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-background">
      {/* Breaking ticker */}
      <div className="border-b bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2 text-sm sm:px-6">
          <span className="flex shrink-0 items-center gap-1.5 rounded bg-destructive px-2 py-0.5 font-display font-bold uppercase text-destructive-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            Latest
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
              {[...ticker, ...ticker].map((n, i) => (
                <Link
                  key={i}
                  to="/news/$slug"
                  params={{ slug: n.slug }}
                  className="hover:text-gold"
                >
                  {n.title}
                </Link>
              ))}
              {ticker.length === 0 && <span>No headlines yet</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AdSlot
          format="leaderboard"
          slot={import.meta.env["VITE_ADSENSE_SLOT_TOP"] as string | undefined}
        />

        {/* Masthead */}
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-4 border-navy pb-3">
          <h1 className="truncate text-5xl font-extrabold uppercase leading-none text-navy sm:text-7xl">
            Buruj News
          </h1>
          <p className="hidden text-right text-sm text-muted-foreground sm:block">
            {today}
            <br />
            Ikorodu, Lagos
          </p>
        </div>
        <nav className="sticky top-16 z-30 -mx-4 flex gap-1 overflow-x-auto border-b bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide",
                cat === c ? "bg-navy text-navy-foreground" : "text-navy hover:bg-secondary",
              )}
            >
              {c}
            </button>
          ))}
        </nav>

        {!lead ? (
          <p className="py-16 text-center text-muted-foreground">News updates are coming soon.</p>
        ) : (
          <>
            <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <Link
                  to="/news/$slug"
                  params={{ slug: lead.slug }}
                  className="group relative block aspect-[16/10] overflow-hidden rounded-lg"
                >
                  <NewsCover
                    src={lead.cover_url}
                    title={lead.title}
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                  <div className="absolute bottom-0 p-5 text-navy-foreground sm:p-8">
                    <Meta n={lead} light />
                    <h2 className="mt-2 text-3xl font-extrabold uppercase leading-tight sm:text-5xl">
                      {lead.title}
                    </h2>
                    {lead.excerpt && (
                      <p className="mt-3 line-clamp-2 max-w-2xl text-navy-foreground/85">
                        {lead.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
                {second.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {second.map((n) => (
                      <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group">
                        <div className="aspect-video overflow-hidden rounded">
                          <NewsCover
                            src={n.cover_url}
                            title={n.title}
                            className="transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="mt-3">
                          <Meta n={n} />
                          <h3 className="mt-1 font-display text-2xl font-bold uppercase leading-tight text-navy group-hover:text-primary">
                            {n.title}
                          </h3>
                          {n.excerpt && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {n.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <aside className="space-y-6">
                <div>
                  <p className="border-b-2 border-gold pb-2 font-display text-lg font-bold uppercase text-navy">
                    Most read
                  </p>
                  <ol className="divide-y">
                    {mostRead.map((n, i) => (
                      <li key={n.id}>
                        <Link
                          to="/news/$slug"
                          params={{ slug: n.slug }}
                          className="group flex gap-4 py-3"
                        >
                          <span className="w-8 shrink-0 font-display text-4xl font-extrabold leading-none text-primary/40">
                            {i + 1}
                          </span>
                          <span className="min-w-0 font-display text-lg font-bold uppercase leading-tight text-navy group-hover:text-primary">
                            {n.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
                <AdSlot
                  format="rectangle"
                  slot={import.meta.env["VITE_ADSENSE_SLOT_SIDE"] as string | undefined}
                />
              </aside>
            </section>

            {grid.length > 0 && (
              <section className="mt-12">
                <h2 className="border-b-2 border-gold pb-2 font-display text-2xl font-bold uppercase text-navy">
                  More headlines
                </h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {grid.map((n) => (
                    <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group">
                      <div className="aspect-video overflow-hidden rounded">
                        <NewsCover
                          src={n.cover_url}
                          title={n.title}
                          className="transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3">
                        <Meta n={n} />
                        <h3 className="mt-1 font-display text-xl font-bold uppercase leading-tight text-navy group-hover:text-primary">
                          {n.title}
                        </h3>
                        {n.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {n.excerpt}
                          </p>
                        )}
                      </div>
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
