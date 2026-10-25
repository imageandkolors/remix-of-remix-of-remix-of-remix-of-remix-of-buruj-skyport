import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Clock } from "lucide-react";
import { newsArticleQuery, newsQuery } from "@/lib/queries";
import { NewsCover, fmtNewsDate } from "@/components/site/NewsList";
import { AdSlot, SITE_URL, ShareBar, readingMinutes } from "@/components/site/NewsExtras";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ context, params }) => {
    const a = await context.queryClient.ensureQueryData(newsArticleQuery(params.slug));
    if (!a) throw notFound();
    void context.queryClient.prefetchQuery(newsQuery);
    return { title: a.title, excerpt: a.excerpt, cover: a.cover_url, category: a.category, author: a.author, published: a.published_at };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Article unavailable — Buruj News" }, { name: "robots", content: "noindex" }] };
    const url = `${SITE_URL}/news/${params.slug}`;
    const t = `${loaderData.title} — Buruj News`;
    const d = loaderData.excerpt ?? "News from Buruj Sports Academy, Ikorodu, Lagos.";
    const img = loaderData.cover && /^https:\/\//.test(loaderData.cover) ? loaderData.cover : null;
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: loaderData.title }, { property: "og:description", content: d },
        { property: "og:type", content: "article" }, { property: "og:url", content: url },
        { property: "og:site_name", content: "Buruj Sports Academy" },
        ...(loaderData.published ? [{ property: "article:published_time", content: loaderData.published }] : []),
        { property: "article:section", content: loaderData.category },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.title }, { name: "twitter:description", content: d },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify({
          "@context": "https://schema.org", "@type": "NewsArticle",
          headline: loaderData.title, description: d, ...(img ? { image: [img] } : {}),
          datePublished: loaderData.published, dateModified: loaderData.published,
          author: { "@type": "Organization", name: loaderData.author || "Buruj Media Team" },
          publisher: { "@type": "Organization", name: "Buruj Sports Academy", logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-192.png` } },
          mainEntityOfPage: { "@type": "WebPage", "@id": url }, articleSection: loaderData.category,
        }) },
        { type: "application/ld+json", children: JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
            { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
          ],
        }) },
      ],
    };
  },
  notFoundComponent: () => <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-4xl font-extrabold uppercase text-navy">Article not found</h1><Button asChild className="mt-6"><Link to="/news">All news</Link></Button></div>,
  errorComponent: () => <p className="p-16 text-center text-muted-foreground">Could not load this article. Please refresh.</p>,
  component: Article,
});

function Article() {
  const { slug } = Route.useParams();
  const { data: a } = useSuspenseQuery(newsArticleQuery(slug));
  const { data: all } = useSuspenseQuery(newsQuery);
  if (!a) return null;
  const url = `${SITE_URL}/news/${a.slug}`;
  const sameCat = all.filter((n) => n.id !== a.id && n.category === a.category);
  const related = [...sameCat, ...all.filter((n) => n.id !== a.id && n.category !== a.category)].slice(0, 4);
  const more = all.filter((n) => n.id !== a.id).slice(0, 8);
  const paras = (a.body ?? "").split(/\n\s*\n/).filter(Boolean);
  const mid = Math.min(3, paras.length);

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <AdSlot format="leaderboard" slot={import.meta.env["VITE_ADSENSE_SLOT_TOP"] as string | undefined} />
      <nav aria-label="Breadcrumb" className="mt-6 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3 shrink-0" />
        <Link to="/news" className="hover:text-primary">News</Link><ChevronRight className="h-3 w-3 shrink-0" />
        <span className="truncate text-foreground">{a.category}</span>
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <header>
            <span className="inline-block rounded bg-navy px-2 py-0.5 font-display text-xs font-bold uppercase tracking-widest text-navy-foreground">{a.category}</span>
            <h1 className="mt-3 text-4xl font-extrabold uppercase leading-[0.95] text-navy sm:text-6xl">{a.title}</h1>
            {a.excerpt && <p className="mt-4 text-xl leading-snug text-muted-foreground">{a.excerpt}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-3">
              <p className="text-sm text-muted-foreground">
                By <b className="text-foreground">{a.author || "Buruj Media Team"}</b> · <time dateTime={a.published_at ?? undefined}>{fmtNewsDate(a.published_at)}</time>
                <span className="ml-2 inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readingMinutes(a.body)} min read</span>
              </p>
              <ShareBar url={url} title={a.title} />
            </div>
          </header>

          {a.cover_url && (
            <figure className="mt-6">
              <div className="aspect-[16/9] overflow-hidden rounded-lg"><NewsCover src={a.cover_url} title={a.title} /></div>
              <figcaption className="mt-2 text-xs text-muted-foreground">{a.title} · Photo: Buruj Sports Academy</figcaption>
            </figure>
          )}

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground">
            {paras.slice(0, mid).map((p, i) => <p key={i} className={i === 0 ? "whitespace-pre-line first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:leading-none first-letter:text-navy" : "whitespace-pre-line"}>{p}</p>)}
            {paras.length > 3 && <AdSlot format="inline" slot={import.meta.env["VITE_ADSENSE_SLOT_INLINE"] as string | undefined} className="py-2" />}
            {paras.slice(mid).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>

          <div className="mt-10 rounded-lg border bg-secondary p-5">
            <p className="font-display text-lg font-bold uppercase text-navy">Share this story</p>
            <ShareBar url={url} title={a.title} className="mt-3" />
          </div>
        </div>

        <aside className="lg:border-l lg:pl-8">
          <div className="space-y-8 lg:sticky lg:top-24">
            <div>
              <p className="border-b-2 border-gold pb-2 font-display text-lg font-bold uppercase text-navy">Related stories</p>
              <div className="divide-y">
                {related.map((n) => (
                  <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group flex gap-3 py-4">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded"><NewsCover src={n.cover_url} title={n.title} /></div>
                    <div className="min-w-0"><p className="text-xs uppercase text-muted-foreground">{n.category} · {fmtNewsDate(n.published_at)}</p><p className="font-display font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</p></div>
                  </Link>
                ))}
                {related.length === 0 && <p className="py-4 text-sm text-muted-foreground">More stories coming soon.</p>}
              </div>
            </div>
            <AdSlot format="rectangle" slot={import.meta.env["VITE_ADSENSE_SLOT_SIDE"] as string | undefined} />
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="border-b-4 border-navy pb-2 font-display text-2xl font-extrabold uppercase text-navy">More from Buruj News</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((n) => (
              <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group">
                <div className="aspect-video overflow-hidden rounded"><NewsCover src={n.cover_url} title={n.title} className="transition-transform group-hover:scale-105" /></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">{n.category}</p>
                <h3 className="mt-1 font-display text-lg font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
