import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { FileText, ClipboardCheck, Trophy, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const schema = z.object({
  player_name: z.string().trim().min(2, "Enter the player's name").max(120),
  date_of_birth: z.string().optional(),
  position: z.string().trim().max(60).optional(),
  guardian_name: z.string().trim().min(2, "Enter guardian's name").max(120),
  guardian_phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  guardian_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  programme: z.string().optional(),
});

function Admissions() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the form"); return; }
    setLoading(true);
    const d = parsed.data;
    const { error } = await supabase.from("trial_registrations").insert({
      player_name: d.player_name,
      guardian_name: d.guardian_name,
      guardian_phone: d.guardian_phone,
      position: d.position || null,
      programme: d.programme || null,
      date_of_birth: d.date_of_birth || null,
      guardian_email: d.guardian_email || null,
    });
    setLoading(false);
    if (error) { toast.error("Could not submit. Please try again."); return; }
    toast.success("Trial registration received! Our team will contact you.");
    form.reset();
  }

  return (
    <>
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">Admissions</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">Your journey starts here</h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/80">Applications are fully online, end to end. Every application is reviewed and approved by our admissions team.</p>
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
            <form onSubmit={onSubmit} className="rounded-xl border-t-4 border-gold bg-card p-8 shadow-xl">
              <h2 className="text-4xl font-extrabold uppercase text-navy">Trial match registration</h2>
              <p className="mt-1 text-muted-foreground">No account needed. We'll confirm your trial date by phone or WhatsApp.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field name="player_name" label="Player's full name" required />
                <Field name="date_of_birth" label="Date of birth" type="date" />
                <Field name="position" label="Playing position" />
                <div className="space-y-1.5">
                  <Label htmlFor="programme">Programme</Label>
                  <select id="programme" name="programme" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option>Play & Study</option>
                    <option>Football Camping</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
                <Field name="guardian_name" label="Parent / guardian name" required />
                <Field name="guardian_phone" label="Guardian phone" type="tel" required />
                <div className="sm:col-span-2"><Field name="guardian_email" label="Guardian email" type="email" /></div>
              </div>
              <Button type="submit" disabled={loading} size="lg" className="mt-6 w-full font-display text-base font-bold uppercase">
                {loading ? "Submitting…" : "Register for trial"}
              </Button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
