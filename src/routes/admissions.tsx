import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ClipboardCheck, Trophy, UserCheck } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { TrialForm } from "@/components/site/TrialForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions & Trials — Buruj Sports Academy" },
      { name: "description", content: "How to join Buruj Sports Academy: admission steps, requirements and trial match registration for Play & Study and Football Camping." },
      { property: "og:title", content: "Admissions & Trials — Buruj Sports Academy" },
      { property: "og:description", content: "Apply online and register for a Buruj trial match." },
    ],
  }),
  component: Admissions,
});

const STEPS = [
  { icon: FileText, t: "Enquire & apply", b: "Submit an online application or register for a trial match." },
  { icon: Trophy, t: "Trial & assessment", b: "Attend a trial match on campus for football and academic assessment." },
  { icon: ClipboardCheck, t: "Review & offer", b: "Our admissions team reviews results and issues an offer." },
  { icon: UserCheck, t: "Enrol & resume", b: "Complete documents, confirm fees and move into residence." },
];

const REQS = [
  "Birth certificate or international passport",
  "Recent passport photographs",
  "Last school report (Play & Study applicants)",
  "Medical fitness report",
  "Parent / guardian contact and consent",
];

function Admissions() {

  return (
    <>
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">Admissions</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">Your journey starts here</h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/80">Applications are fully online, end to end. Every application is reviewed and approved by our admissions team.</p>
          <Button asChild size="lg" className="animate-rise mt-8 bg-gold font-display text-base font-bold uppercase text-gold-foreground hover:bg-gold/90"><Link to="/apply">Start online application</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Process" title="Four steps to Buruj" />
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 100}>
              <div className="glow-hover relative h-full rounded-xl border bg-card p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-secondary">{i + 1}</span>
                <s.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-2xl font-bold uppercase text-navy">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="trial" className="scroll-mt-20 bg-secondary py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Requirements" title="What you'll need" />
            <ul className="mt-8 space-y-3">
              {REQS.map((r) => (
                <li key={r} className="flex gap-3 rounded-lg bg-card p-4"><span className="h-2 w-2 shrink-0 translate-y-2 rounded-full bg-gold" />{r}</li>
              ))}
            </ul>
          </div>
          <Reveal>
            <div className="rounded-xl border-t-4 border-gold bg-card p-8 shadow-xl">
              <h2 className="text-4xl font-extrabold uppercase text-navy">Trial match registration</h2>
              <p className="mb-6 mt-1 text-muted-foreground">No account needed. We'll confirm your trial date by phone or WhatsApp.</p>
              <TrialForm />
              <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
                Ready for a full admission? <Link to="/apply" className="font-semibold text-primary underline">Complete the online application →</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
