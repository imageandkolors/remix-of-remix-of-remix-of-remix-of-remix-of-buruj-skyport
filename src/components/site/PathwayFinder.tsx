import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./Reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  { q: "How old is the player?", opts: [{ v: "9-18", l: "9 – 18 years" }, { v: "19-22", l: "19 – 22 years" }] },
  { q: "Is the player still in secondary school?", opts: [{ v: "yes", l: "Yes — JSS 1 to SS 3" }, { v: "no", l: "No / finished school" }] },
  { q: "What's the main goal?", opts: [{ v: "balance", l: "Football + education" }, { v: "football", l: "Football full-time" }] },
];

export function PathwayFinder() {
  const [answers, setAnswers] = useState<string[]>([]);
  const step = answers.length;
  const done = step === STEPS.length;
  const playStudy = answers[0] === "9-18" && answers[1] === "yes" && answers[2] === "balance";
  const result = playStudy
    ? { name: "Play & Study", body: "Residential schooling from JSS 1 to SS 3 with daily elite training — the complete package for school-age players." }
    : { name: "Football Camping", body: "An intensive residential football programme (ages 9 – 22) focused on performance and the international trial pathway." };

  return (
    <section id="pathway" className="scroll-mt-20 bg-navy py-24 text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <SectionHeading light eyebrow="Find your pathway" title="Three questions. One clear route." intro="Not sure which programme fits? Answer three quick questions and we'll point you to the right funnel." />
        <div className="rounded-xl border border-navy-foreground/15 bg-navy-foreground/5 p-8">
          <div className="mb-6 flex gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-gold" : "bg-navy-foreground/20")} />
            ))}
          </div>
          {!done ? (
            <div key={step} className="animate-rise">
              <p className="font-display text-sm uppercase tracking-widest text-sky">Step {step + 1} of 3</p>
              <h3 className="mt-2 text-3xl font-bold uppercase">{STEPS[step]!.q}</h3>
              <div className="mt-6 grid gap-3">
                {STEPS[step]!.opts.map((o) => (
                  <button key={o.v} onClick={() => setAnswers([...answers, o.v])} className="rounded-lg border border-navy-foreground/20 px-5 py-4 text-left text-lg font-medium transition-all hover:border-gold hover:bg-gold hover:text-gold-foreground">
                    {o.l}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setAnswers(answers.slice(0, -1))} className="mt-4 inline-flex items-center gap-1 text-sm text-navy-foreground/70 hover:text-gold">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>
          ) : (
            <div className="animate-rise">
              <p className="font-display text-sm uppercase tracking-widest text-sky">Recommended for you</p>
              <h3 className="mt-2 text-5xl font-extrabold uppercase text-gold">{result.name}</h3>
              <p className="mt-3 text-lg text-navy-foreground/85">{result.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">
                  <Link to="/apply">Begin application</Link>
                </Button>
                <Button variant="ghost" onClick={() => setAnswers([])} className="font-display uppercase text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
                  <RotateCcw className="h-4 w-4" /> Start again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
