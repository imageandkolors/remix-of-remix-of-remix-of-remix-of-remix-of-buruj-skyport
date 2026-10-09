import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import crest from "@/assets/buruj-crest.jpeg.asset.json";
import { splashQuery } from "@/lib/queries";
import type { SplashSlide } from "@/lib/content.functions";

const FALLBACK: SplashSlide[] = [{ id: "f", sort: 0, kind: "crest", title: "Buruj Sports Academy", subtitle: "Make your dreams come true", image_path: null, image_url: null, bg_color: "#0b1f3a", is_active: true }];
const SLIDE_MS = 2600;

/** Launch slides (up to 3, managed in the staff Content page), once per session, skippable. */
export function SplashScreen() {
  const [open, setOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const [i, setI] = useState(0);
  const q = useQuery({ ...splashQuery, enabled: open });
  const slides = (q.data?.length ? q.data : FALLBACK).slice(0, 3);

  useEffect(() => {
    if (sessionStorage.getItem("bsa-splash")) return;
    sessionStorage.setItem("bsa-splash", "1");
    setOpen(true);
  }, []);

  const close = () => { setFade(true); setTimeout(() => setOpen(false), 400); };
  const next = () => (i + 1 >= slides.length ? close() : setI(i + 1));

  useEffect(() => {
    if (!open || fade) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  });

  if (!open) return null;
  const s = slides[Math.min(i, slides.length - 1)]!;
  const showImage = (s.kind === "image" || s.kind === "image_text") && s.image_url;
  const showText = s.kind !== "image";
  return (
    <div role="dialog" aria-label="Welcome" onClick={next}
      style={{ backgroundColor: s.bg_color }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center text-navy-foreground transition-opacity duration-400 ${fade ? "opacity-0" : "opacity-100"}`}>
      {showImage && <img key={s.id} src={s.image_url!} alt="" className="absolute inset-0 h-full w-full animate-kenburns object-cover" />}
      {showImage && showText && <div className="absolute inset-0 bg-hero-fade" />}
      <div key={`c-${s.id}`} className="relative flex animate-rise flex-col items-center px-8 text-center">
        {s.kind === "crest" && (
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-6 animate-ping rounded-full bg-gold/20" />
            <img src={s.image_url ?? crest.url} alt="" className="relative h-32 w-32 rounded-3xl object-contain shadow-2xl" />
          </div>
        )}
        {showText && s.title && <p className="font-display text-3xl font-extrabold uppercase tracking-wider sm:text-5xl">{s.title}</p>}
        {showText && s.subtitle && <p className="mt-2 max-w-md text-sm uppercase tracking-[0.25em] text-gold">{s.subtitle}</p>}
      </div>
      <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-0 right-0 flex items-center justify-between px-6">
        <div className="flex gap-2">{slides.map((x, k) => <span key={x.id} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-gold" : "w-1.5 bg-navy-foreground/40"}`} />)}</div>
        <button onClick={(e) => { e.stopPropagation(); close(); }} className="rounded-full bg-navy-foreground/15 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider backdrop-blur hover:bg-navy-foreground/25">Skip</button>
      </div>
    </div>
  );
}
