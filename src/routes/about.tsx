import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, HeartHandshake, ShieldCheck, Trophy, Users, Globe, Dumbbell, Home } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import campus from "@/assets/hero-campus.jpg";
import training from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Buruj Sports Academy — Our Story Since 2013" },
      { name: "description", content: "Founded in 2013 by Dr. Salaudeen Waheed Buruj, Buruj Sports Academy combines certified coaching, full secondary education and 24/7 welfare in Ikorodu, Lagos." },
      { property: "og:title", content: "About Buruj Sports Academy" },
      { property: "og:description", content: "Our history, leadership, coaching philosophy, dual-team safety model and pathway to global success." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const TIMELINE = [
  { year: "2013", text: "Buruj FC & Sports Academy founded in Ikorodu, Lagos, to give young Nigerian talent a structured route into professional football." },
  { year: "Growth", text: "Residential boarding introduced, alongside the Play & Study model combining full secondary education with elite training." },
  { year: "Today", text: "International trial showcases across the UK, Spain, France, Italy, Portugal, Lithuania and Sweden — plus national team call-ups at U-15, U-17 and U-20 levels." },
];

const PILLARS = [
  { icon: Trophy, t: "Certified coaching", b: "Coaches certified by the NFF and LSFA, holding FIFA certificates, leading structured daily sessions." },
  { icon: GraduationCap, t: "Academic excellence", b: "Full Nigerian curriculum from JSS1 to SS3 with WAEC and NECO preparation, qualified teachers and small classes." },
  { icon: ShieldCheck, t: "Coaching Team", b: "Technical, tactical, physical and mental development tracked every term, with match exposure and evaluation." },
  { icon: HeartHandshake, t: "24/7 Welfare Team", b: "Round-the-clock pastoral care, health supervision and boarding support — our dual-team safety model." },
];

const LIFE = [
  { icon: Home, t: "Residential life", b: "Clean, secure hostel accommodation with maximum campus security, nutritious daily meals designed for young athletes, and medical insurance coverage with routine health checks." },
  { icon: Dumbbell, t: "Fitness & conditioning", b: "Dedicated gym and conditioning sessions build strength, stamina and agility, with personal fitness tracking and injury prevention and rehabilitation support." },
  { icon: Users, t: "Character & leadership", b: "Character building and leadership mentoring shape disciplined young people — on the pitch, in the classroom and beyond." },
  { icon: Globe, t: "Global pathway", b: "Professional club trials abroad, scholarships and national team selections through our strong partnerships and global network." },
];

function About() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-28 text-navy-foreground">
        <img src={campus} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" width={1600} height={912} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">About the academy</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">Discipline. Development. Destiny.</h1>
          <p className="animate-rise mt-6 max-w-2xl text-lg opacity-85">
            Buruj Sports Academy offers a unique and intensive residential experience that combines top-tier football training, career-building exposure, and a supportive environment for athletic and personal development. We identify and groom elite football talent, opening doors to national recognition and international football trials.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Our story" title="Excellence since 2013" intro="Buruj Sports Academy was founded to give young Nigerian talent a structured, safe and ambitious route into professional football — without sacrificing education. Our commitment is to nurture talent, instill discipline, and create real football opportunities." />
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
        <SectionHeading eyebrow="How we work" title="Coaching philosophy & safety" intro="Every player is supported by two dedicated teams working side by side — a Coaching Team for development and a 24/7 Welfare Team for care." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((f, i) => (
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

      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Beyond the pitch" title="A complete environment for growth" intro="We go beyond just sports — nurturing young talents academically, athletically and morally, setting them on a clear path to success." />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {LIFE.map((f, i) => (
              <Reveal key={f.t} delay={i * 80}>
                <div className="flex h-full gap-4 rounded-xl border border-navy-foreground/15 p-6">
                  <f.icon className="h-8 w-8 shrink-0 text-gold" />
                  <div>
                    <h3 className="text-2xl font-bold uppercase">{f.t}</h3>
                    <p className="mt-2 opacity-85">{f.b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">
              <Link to="/admissions">Explore our programmes</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
