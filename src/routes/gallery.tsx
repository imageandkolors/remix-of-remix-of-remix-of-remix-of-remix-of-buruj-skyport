import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { NewsList } from "@/components/site/NewsList";
import { newsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import training from "@/assets/hero-training.jpg";
import study from "@/assets/hero-study.jpg";
import trials from "@/assets/hero-trials.jpg";
import campus from "@/assets/hero-campus.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Media & Matchday — Buruj Sports Academy" },
      { name: "description", content: "Photos, video highlights and the latest news from Buruj Sports Academy in Ikorodu, Lagos." },
      { property: "og:title", content: "Media & Matchday — Buruj Sports Academy" },
      { property: "og:description", content: "Training, matchday and campus life at Buruj." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery),
  errorComponent: () => <p className="p-10 text-center">We couldn't load media. Please refresh.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: Gallery,
});

const ITEMS = [
  { img: training, cat: "Training", title: "Sunset conditioning session", video: false },
  { img: trials, cat: "Matchday", title: "Showcase highlights", video: true },
  { img: study, cat: "Campus", title: "Play & Study boarders", video: false },
  { img: campus, cat: "Campus", title: "The Ikorodu campus", video: true },
];
const CATS = ["All", "Training", "Matchday", "Campus"];

function Gallery() {
  const { data: news } = useSuspenseQuery(newsQuery);
  const [cat, setCat] = useState("All");
  const shown = ITEMS.filter((i) => cat === "All" || i.cat === cat);
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Media" title="Matchday & campus gallery" intro="Illustrative imagery shown — official academy photos and videos will be added by staff." />
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-1.5 font-display font-bold uppercase", cat === c ? "border-navy bg-navy text-navy-foreground" : "hover:border-gold")}>{c}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {shown.map((it, i) => (
            <Reveal key={it.title} delay={i * 80}>
              <figure className="group relative aspect-video overflow-hidden rounded-xl">
                <img src={it.img} alt={it.title} loading="lazy" width={1600} height={912} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/10 to-transparent" />
                {it.video && <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-gold-foreground transition-transform group-hover:scale-110"><Play className="h-7 w-7" /></span>}
                <figcaption className="absolute bottom-0 p-5 text-navy-foreground">
                  <p className="font-display text-sm uppercase tracking-widest text-gold">{it.cat}</p>
                  <p className="font-display text-2xl font-bold uppercase">{it.title}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Updates" title="Recent news" />
          <div className="mt-10"><NewsList news={news} /></div>
        </div>
      </section>
    </>
  );
}
