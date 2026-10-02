import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import footballTeam from "@/assets/buruj-football-team.jpeg.asset.json";
import students from "@/assets/buruj-students.jpeg.asset.json";
import trials from "@/assets/hero-trials.jpg";
import campus from "@/assets/hero-campus.jpg";

const SLIDES = [
  { img: footballTeam.url, eyebrow: "Elite football development", title: "Built for the next level", body: "NFF & LSFA certified coaches, structured daily sessions and a proven player pathway." },
  { img: students.url, eyebrow: "Residential Play & Study", title: "Train hard. Learn harder.", body: "Full JSS 1 – SS 3 schooling alongside professional-grade training, with 24/7 welfare care." },
  { img: trials, eyebrow: "International trials", title: "UK · Spain · Italy", body: "Showcase opportunities that put Buruj players in front of European clubs and scouts." },
  { img: campus, eyebrow: "The Ikorodu campus", title: "Home of Buruj", body: "Pitch, boarding and classrooms together in Ogolonto, Ikorodu, Lagos." },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, [i]);
  const go = (d: number) => setI((p) => (p + d + SLIDES.length) % SLIDES.length);
  const s = SLIDES[i]!;

  return (
    <section className="relative h-[82vh] min-h-[560px] overflow-hidden bg-navy text-navy-foreground">
      {SLIDES.map((sl, idx) => (
        <img
          key={idx}
          src={sl.img}
          alt=""
          width={1600}
          height={912}
          loading={idx === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "animate-kenburns opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6">
        <div key={i} className="max-w-2xl">
          <p className="animate-rise font-display text-sm font-semibold uppercase tracking-[0.3em] text-gold">{s.eyebrow}</p>
          <h1 className="animate-rise mt-3 text-5xl font-extrabold uppercase leading-[0.9] sm:text-7xl" style={{ animationDelay: "120ms" }}>
            {s.title}
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/85" style={{ animationDelay: "240ms" }}>{s.body}</p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
            <Button asChild size="lg" className="bg-gold font-display text-base font-bold uppercase text-gold-foreground hover:bg-gold/90">
              <Link to="/admissions">Start application</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy-foreground/40 bg-transparent font-display text-base font-bold uppercase text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              <a href="#pathway">Find your pathway</a>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-10 bg-gold" : "w-5 bg-navy-foreground/40"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => go(-1)} aria-label="Previous" className="rounded-full border border-navy-foreground/30 p-2 hover:border-gold hover:text-gold"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} aria-label="Next" className="rounded-full border border-navy-foreground/30 p-2 hover:border-gold hover:text-gold"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
    </section>
  );
}
