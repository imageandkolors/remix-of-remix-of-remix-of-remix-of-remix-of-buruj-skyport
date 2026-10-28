import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Facebook, Instagram, Youtube } from "lucide-react";
import { getSocialFeeds } from "@/lib/content.functions";
import { MediaLightbox, MediaThumb, type LightboxItem } from "./MediaLightbox";

const icon = { youtube: Youtube, instagram: Instagram, facebook: Facebook } as const;
const colors = {
  youtube: "text-red-600",
  instagram: "text-pink-600",
  facebook: "text-blue-600",
} as const;

export function SocialFeeds() {
  const { data = [] } = useQuery({ queryKey: ["social-feeds"], queryFn: () => getSocialFeeds() });
  const [active, setActive] = useState<LightboxItem | null>(null);
  const videos = data.flatMap((feed) =>
    feed.items.map((item) => ({
      id: item.id ?? `${feed.id}-${item.sort}`,
      title: item.title || feed.label,
      caption: feed.label,
      kind: "youtube" as const,
      media_url: item.video_url,
      external_url: item.video_url,
      thumbnail_url: item.thumbnail_url,
    })),
  );
  if (!data.length) return null;
  const cards = videos.slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Stay connected
          </p>
          <h2 className="mt-2 text-3xl font-extrabold uppercase text-navy">Buruj on social</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Watch the latest academy videos here without leaving the site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.map((feed) => {
            const Icon = icon[feed.platform];
            return (
              <a
                key={feed.id}
                href={feed.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground hover:text-primary"
              >
                <Icon className={`h-4 w-4 ${colors[feed.platform]}`} />
                {feed.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            );
          })}
        </div>
      </div>
      {cards.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => (
            <div
              key={item.id}
              className="aspect-video overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              <MediaThumb item={item} onClick={() => setActive(item)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          Video updates will appear here soon. Visit the official social feed links above for more.
        </div>
      )}
      <MediaLightbox
        item={active}
        onClose={() => setActive(null)}
        onPrevious={
          active && cards.findIndex((item) => item.id === active.id) > 0
            ? () => setActive(cards[cards.findIndex((item) => item.id === active.id) - 1]!)
            : undefined
        }
        onNext={
          active && cards.findIndex((item) => item.id === active.id) < cards.length - 1
            ? () => setActive(cards[cards.findIndex((item) => item.id === active.id) + 1]!)
            : undefined
        }
      />
    </section>
  );
}
