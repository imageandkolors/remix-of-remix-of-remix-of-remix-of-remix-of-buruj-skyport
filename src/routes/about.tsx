import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck, Trophy, Users } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import campus from "@/assets/hero-campus.jpg";
import training from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Buruj Sports Academy — Our Story Since 2013" },
      { name: "description", content: "Founded in 2013 by Dr. Salaudeen Waheed Buruj, Buruj Sports Academy combines certified coaching with a 24/7 welfare team in Ikorodu, Lagos." },
      { property: "og:title", content: "About Buruj Sports Academy" },
      { property: "og:description", content: "Our history, leadership, coaching philosophy and dual-team safety model." },
    ],
  }),
  component: About,
});

const TIMELINE = [
  { year: "2013", text: "Buruj FC & Sports Academy founded in Ikorodu, Lagos." },
  { year: "Growth", text: "Residential boarding and the Play & Study programme introduced." },
  { year: "Today", text: "International trial showcases in the UK, Spain and Italy." },
];

function About() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-28 text-navy-foreground">
        <img src={campus} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" width={1600} height={912} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">About the academy</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">Discipline. Development. Destiny.</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Our story" title="Excellence since 2013" intro="Buruj Sports Academy was founded to give young Nigerian talent a structured, safe and ambitious route into professional football — without sacrificing education." />
          <ol className="mt-10 space-y-6 border-l-2 border-gold pl-6">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 100}>
                <li>
                  <p className="font-display text-2xl font-extrabold uppercase text-primary">{t.year}</p>
                  <p className="text-muted-foreground">{t.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal>
          <img src={training} alt="Buruj players in training" className="h-full w-full rounded-xl object-cover" loading="lazy" width={1600} height={912} />
        </Reveal>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Leadership" title="The people behind Buruj" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { role: "Founder", name: "Dr. Salaudeen Waheed Buruj", body: "Visionary founder who established the academy in 2013 to develop talent on and off the pitch." },
              { role: "Club Patron", name: "Club Patron", body: "Champions the academy's mission and partnerships across the football community." },
              { role: "Matron", name: "Academy Matron", body: "Leads boarding life and pastoral care for every resident player." },
            ].map((p, i) => (
              <Reveal key={p.role} delay={i * 100}>
                <div className="glow-hover h-full rounded-xl bg-card p-8">
                  <p className="font-display text-sm font-bold uppercase tracking-widest text-gold">{p.role}</p>
                  <h3 className="mt-2 text-3xl font-bold uppercase text-navy">{p.name}</h3>
                  <p className="mt-3 text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="How we work" title="Coaching philosophy & safety" intro="Every player is supported by two dedicated teams working side by side." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Trophy, t: "Certified coaching", b: "Coaches certified by the NFF and LSFA, holding FIFA certificates." },
            { icon: Users, t: "Player-first development", b: "Technical, tactical, physical and mental growth tracked every term." },
            { icon: ShieldCheck, t: "Coaching Team", b: "Structured daily sessions, match exposure and performance evaluation." },
            { icon: HeartHandshake, t: "24/7 Welfare Team", b: "Round-the-clock pastoral care, health and boarding supervision." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 80}>
              <div className="glow-hover h-full rounded-xl border bg-card p-6">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-2xl font-bold uppercase text-navy">{f.t}</h3>
                <p className="mt-2 text-muted-foreground">{f.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
