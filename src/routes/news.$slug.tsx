import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { newsArticleQuery, newsQuery } from "@/lib/queries";
import { NewsCover, fmtNewsDate } from "@/components/site/NewsList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ context, params }) => {
    const a = await context.queryClient.ensureQueryData(newsArticleQuery(params.slug));
    if (!a) throw notFound();
    void context.queryClient.prefetchQuery(newsQuery);
    return { title: a.title, excerpt: a.excerpt, cover: a.cover_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article not found — Buruj News" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} — Buruj News`;
    const d = loaderData.excerpt ?? "News from Buruj Sports Academy.";
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
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
  const related = all.filter((n) => n.id !== a.id).slice(0, 4);
  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Buruj News</Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-widest text-primary">{a.category}</p>
          <h1 className="mt-2 text-4xl font-extrabold uppercase leading-[0.95] text-navy sm:text-6xl">{a.title}</h1>
          {a.excerpt && <p className="mt-4 text-xl text-muted-foreground">{a.excerpt}</p>}
          <p className="mt-4 border-y py-3 text-sm text-muted-foreground">By <b className="text-foreground">{a.author || "Buruj Media Team"}</b> · {fmtNewsDate(a.published_at)}</p>
          {a.cover_url && <div className="mt-6 overflow-hidden rounded-lg"><NewsCover src={a.cover_url} title={a.title} /></div>}
          <div className="mt-8 space-y-5 text-lg leading-relaxed">{(a.body ?? "").split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
        </div>
        <aside className="lg:border-l lg:pl-8">
          <p className="border-b-2 border-gold pb-2 font-display text-lg font-bold uppercase text-navy">More stories</p>
          <div className="divide-y">
            {related.map((n) => (
              <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="group flex gap-3 py-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded"><NewsCover src={n.cover_url} title={n.title} /></div>
                <div><p className="text-xs uppercase text-muted-foreground">{fmtNewsDate(n.published_at)}</p><p className="font-display font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</p></div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}
