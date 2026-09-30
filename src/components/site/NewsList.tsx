import { Reveal } from "./Reveal";

export type News = { id: string; title: string; excerpt: string | null; published_at: string | null };

export function NewsList({ news }: { news: News[] }) {
  if (!news.length) return <p className="text-muted-foreground">News updates are coming soon.</p>;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {news.map((n, i) => (
        <Reveal key={n.id} delay={i * 100}>
          <article className="glow-hover h-full rounded-xl border border-l-4 border-l-gold bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {n.published_at ? new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </p>
            <h3 className="mt-2 text-2xl font-bold uppercase leading-tight text-navy">{n.title}</h3>
            <p className="mt-2 text-muted-foreground">{n.excerpt}</p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
