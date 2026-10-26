import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SplashSlide } from "@/lib/content.functions";
import teamAssetSrc from "@/assets/buruj-team.jpeg";
import studentsAssetSrc from "@/assets/buruj-students.jpeg";
import trials from "@/assets/hero-trials.jpg";
import campus from "@/assets/hero-campus.jpg";

const FALLBACK: SplashSlide[] = [
  {
    id: "fallback-1",
    sort: 0,
    kind: "image_text",
    media_kind: "image",
    title: "Built for the next level",
    subtitle:
      "NFF & LSFA certified coaches, structured daily sessions and a proven player pathway.",
    image_path: null,
    image_url: teamAssetSrc,
    bg_color: "#0b1f3a",
    is_active: true,
    created_at: null,
  },
  {
    id: "fallback-2",
    sort: 1,
    kind: "image_text",
    media_kind: "image",
    title: "Train hard. Learn harder.",
    subtitle:
      "Full JSS 1 – SS 3 schooling alongside professional-grade training, with 24/7 welfare care.",
    image_path: null,
    image_url: studentsAssetSrc,
    bg_color: "#0b1f3a",
    is_active: true,
    created_at: null,
  },
  {
    id: "fallback-3",
    sort: 2,
    kind: "image_text",
    media_kind: "image",
    title: "UK · Spain · Italy",
    subtitle:
      "Showcase opportunities that put Buruj players in front of European clubs and scouts.",
    image_path: null,
    image_url: trials,
    bg_color: "#0b1f3a",
    is_active: true,
    created_at: null,
  },
  {
    id: "fallback-4",
    sort: 3,
    kind: "image_text",
    media_kind: "image",
    title: "Home of Buruj Sports Academy",
    subtitle: "Pitch, boarding and classrooms together in Ogolonto, Ikorodu, Lagos.",
    image_path: null,
    image_url: campus,
    bg_color: "#0b1f3a",
    is_active: true,
    created_at: null,
  },
];

function youtubeEmbed(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const id = u.hostname.includes("youtu.be")
      ? u.pathname.slice(1)
      : u.searchParams.get("v") || u.pathname.split("/").pop();
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function HeroSlider({ slides = [] }: { slides?: SplashSlide[] }) {
  const items = slides.length ? slides : FALLBACK;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= items.length) setI(0);
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 6500);
    return () => clearInterval(t);
  }, [i, items.length]);
  const go = (d: number) => setI((p) => (p + d + items.length) % items.length);
  const s = items[i] ?? items[0]!;
  const embed = youtubeEmbed(s.youtube_url);
  return (
    <section
      className="relative h-[82vh] min-h-[560px] overflow-hidden bg-navy text-navy-foreground"
      style={{ backgroundColor: s.bg_color }}
    >
      {items.map((sl, idx) => (
        <div
          key={sl.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {sl.media_kind === "video" && sl.video_url ? (
            <video
              src={sl.video_url}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label={sl.alt_text || sl.title || "Buruj Sports Academy"}
            />
          ) : sl.media_kind === "youtube" && embed ? (
            <iframe
              src={embed}
              title={sl.title || "Buruj Sports Academy video"}
              className="h-full w-full scale-[1.35] object-cover"
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : sl.image_url ? (
            <img
              src={sl.image_url}
              alt={sl.alt_text || ""}
              width={1600}
              height={912}
              loading={idx === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      ))}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6">
        <div key={i} className="max-w-2xl">
          <p className="animate-rise font-display text-sm font-semibold uppercase tracking-[0.3em] text-gold">
            {s.kind === "text" ? "Buruj Sports Academy" : "Elite football development"}
          </p>
          <h1 className="animate-rise mt-3 text-5xl font-extrabold uppercase leading-[0.9] sm:text-7xl">
            {s.title || "Built for the next level"}
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/85">
            {s.subtitle ||
              "Structured football development, residential schooling and international trial pathways."}
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gold font-display text-base font-bold uppercase text-gold-foreground hover:bg-gold/90"
            >
              <Link to="/admissions">Start application</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy-foreground/40 bg-transparent font-display text-base font-bold uppercase text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              <a href={s.link_url || "#pathway"}>
                {s.link_url ? "Learn more" : "Find your pathway"}
              </a>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-10 bg-gold" : "w-5 bg-navy-foreground/40"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="rounded-full border border-navy-foreground/30 p-2 hover:border-gold hover:text-gold"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="rounded-full border border-navy-foreground/30 p-2 hover:border-gold hover:text-gold"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
