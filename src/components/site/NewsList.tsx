import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";
import type { NewsItem } from "@/lib/content.functions";

export const fmtNewsDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export function NewsCover({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  return src ? <img src={src} alt={title} loading="lazy" className={`h-full w-full object-cover ${className}`} />
    : <div className={`grid h-full w-full place-items-center bg-navy font-display text-3xl font-extrabold uppercase text-gold/40 ${className}`}>BSA</div>;
}

export function NewsList({ news }: { news: NewsItem[] }) {
  if (!news.length) return <p className="text-muted-foreground">News updates are coming soon.</p>;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {news.map((n, i) => (
        <Reveal key={n.id} delay={i * 100}>
          <Link to="/news/$slug" params={{ slug: n.slug }} className="group block h-full overflow-hidden rounded-xl border bg-card">
            <div className="aspect-video overflow-hidden"><NewsCover src={n.cover_url} title={n.title} className="transition-transform duration-500 group-hover:scale-105" /></div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{n.category} · <span className="text-muted-foreground">{fmtNewsDate(n.published_at)}</span></p>
              <h3 className="mt-2 text-2xl font-bold uppercase leading-tight text-navy group-hover:text-primary">{n.title}</h3>
              {n.excerpt && <p className="mt-2 line-clamp-2 text-muted-foreground">{n.excerpt}</p>}
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
