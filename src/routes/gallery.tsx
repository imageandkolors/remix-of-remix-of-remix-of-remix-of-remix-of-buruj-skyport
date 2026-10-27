import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { NewsList } from "@/components/site/NewsList";
import { MediaLightbox, MediaThumb, type LightboxItem } from "@/components/site/MediaLightbox";
import { galleryMediaQuery, newsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import training from "@/assets/hero-training.jpg";
import study from "@/assets/hero-study.jpg";
import trials from "@/assets/hero-trials.jpg";
import campus from "@/assets/hero-campus.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Media & Matchday — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "Photos, local video highlights and YouTube media from Buruj Sports Academy in Ikorodu, Lagos.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(newsQuery),
      context.queryClient.ensureQueryData(galleryMediaQuery),
    ]),
  errorComponent: () => (
    <p className="p-10 text-center">We couldn&apos;t load media. Please refresh.</p>
  ),
  component: Gallery,
});

const FALLBACK: LightboxItem[] = [
  {
    id: "legacy-training",
    media_url: training,
    external_url: null,
    kind: "image",
    title: "Sunset conditioning session",
    caption: "Training",
  },
  {
    id: "legacy-trials",
    media_url: trials,
    external_url: null,
    kind: "image",
    title: "Showcase highlights",
    caption: "Matchday",
  },
  {
    id: "legacy-study",
    media_url: study,
    external_url: null,
    kind: "image",
    title: "Play & Study boarders",
    caption: "Campus",
  },
  {
    id: "legacy-campus",
    media_url: campus,
    external_url: null,
    kind: "image",
    title: "The Ikorodu campus",
    caption: "Campus",
  },
];

function Gallery() {
  const { data: news } = useSuspenseQuery(newsQuery);
  const { data: managed } = useSuspenseQuery(galleryMediaQuery);
  const [cat, setCat] = useState("All");
  const [active, setActive] = useState<LightboxItem | null>(null);
  const media = (managed.length ? managed : FALLBACK) as LightboxItem[];
  const cats = useMemo(
    () => ["All", ...new Set(media.map((item) => item.caption || "Academy"))],
    [media],
  );
  const shown = media.filter((item) => cat === "All" || (item.caption || "Academy") === cat);
  const open = (item: LightboxItem) => setActive(item);
  const move = (direction: number) => {
    if (!active) return;
    const index = shown.findIndex((item) => item.id === active.id);
    setActive(shown[(index + direction + shown.length) % shown.length] || null);
  };
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Media"
            title="Matchday & campus gallery"
            intro="Staff-managed local images and videos, plus approved YouTube highlights. Select any item to open the lightbox."
          />
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 font-display font-bold uppercase",
                  cat === c ? "border-navy bg-navy text-navy-foreground" : "hover:border-gold",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {shown.map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <div className="aspect-video">
                <MediaThumb item={item} onClick={() => open(item)} />
              </div>
            </Reveal>
          ))}
        </div>
        {!shown.length && (
          <p className="mt-10 text-muted-foreground">No media has been published yet.</p>
        )}
      </section>
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Updates" title="Recent news" />
          <div className="mt-10">
            <NewsList news={news} />
          </div>
        </div>
      </section>
      <MediaLightbox
        item={active}
        onClose={() => setActive(null)}
        onPrevious={shown.length > 1 ? () => move(-1) : undefined}
        onNext={shown.length > 1 ? () => move(1) : undefined}
      />
    </>
  );
}
