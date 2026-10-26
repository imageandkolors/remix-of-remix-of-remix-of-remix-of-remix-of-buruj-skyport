import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Facebook, Instagram, Youtube } from "lucide-react";
import { getSocialFeeds } from "@/lib/content.functions";

const icon = { youtube: Youtube, instagram: Instagram, facebook: Facebook } as const;
const colors = {
  youtube: "text-red-600",
  instagram: "text-pink-600",
  facebook: "text-blue-600",
} as const;

export function SocialFeeds() {
  const { data = [] } = useQuery({ queryKey: ["social-feeds"], queryFn: () => getSocialFeeds() });
  if (!data.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Stay connected
          </p>
          <h2 className="mt-2 text-3xl font-extrabold uppercase text-navy">Buruj on social</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {data.map((feed) => {
          const Icon = icon[feed.platform];
          return (
            <a
              key={feed.id}
              href={feed.source_url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-7 w-7 ${colors[feed.platform]}`} />
                <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold uppercase text-navy">
                {feed.label}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Open the official {feed.platform} feed to see the latest academy updates.
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
