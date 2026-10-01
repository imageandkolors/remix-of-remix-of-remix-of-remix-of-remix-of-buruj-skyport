import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply Online — Buruj Sports Academy" },
      { name: "description", content: "Complete the Buruj Sports Academy online application for Play & Study or Football Camping in a few simple steps." },
      { property: "og:title", content: "Apply Online — Buruj Sports Academy" },
      { property: "og:description", content: "Multi-step online application for Play & Study and Football Camping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Apply,
});

type Data = Record<string, string>;
const STEPS = ["Programme", "Player", "Guardian", "Health & goals", "Review"] as const;

const stepSchemas = [
  z.object({ programme: z.enum(["Play & Study", "Football Camping"], { message: "Choose a programme" }) }),
  z.object({
    player_name: z.string().trim().min(2, "Enter the player's full name").max(120),
    date_of_birth: z.string().min(1, "Enter date of birth"),
    gender: z.string().max(20).optional(),
    position: z.string().trim().max(60).optional(),
    current_school: z.string().trim().max(150).optional(),
    current_class: z.string().trim().max(40).optional(),
  }),
  z.object({
    guardian_name: z.string().trim().min(2, "Enter guardian's name").max(120),
    guardian_relationship: z.string().trim().max(40).optional(),
    guardian_phone: z.string().trim().min(7, "Enter a valid phone").max(30),
    guardian_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional(),
  }),
  z.object({
    medical_notes: z.string().trim().max(1000).optional(),
    motivation: z.string().trim().max(1500).optional(),
  }),
];

function Apply() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({ programme: "", gender: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setData({ ...data, [k]: e.target.value });

  function next() {
    const r = stepSchemas[step]!.safeParse(data);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check this step"); return; }
    setStep(step + 1);
  }

  async function submit() {
    if (!consent) { toast.error("Please confirm guardian consent"); return; }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const n = (k: string) => data[k]?.trim() || null;
    const { error } = await supabase.from("applications").insert({
      user_id: u.user?.id ?? null,
      programme: data.programme!,
      player_name: data.player_name!.trim(),
      date_of_birth: n("date_of_birth"),
      gender: n("gender"), position: n("position"),
      current_school: n("current_school"), current_class: n("current_class"),
      guardian_name: data.guardian_name!.trim(), guardian_relationship: n("guardian_relationship"),
      guardian_phone: data.guardian_phone!.trim(), guardian_email: n("guardian_email"),
      address: n("address"), medical_notes: n("medical_notes"), motivation: n("motivation"),
      consent: true,
    });
    setLoading(false);
    if (error) { toast.error("Could not submit your application. Please try again."); return; }
    setDone(true);
  }

  return (
    <>
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">Online application</p>
          <h1 className="animate-rise mt-3 text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl">Apply to Buruj</h1>
          <p className="animate-rise mt-4 max-w-xl text-lg text-navy-foreground/80">Five short steps. Every application is reviewed by our admissions team.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {done ? (
          <div className="animate-rise rounded-xl border-t-4 border-gold bg-card p-10 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-foreground"><Check className="h-8 w-8" /></div>
            <h2 className="mt-5 text-4xl font-extrabold uppercase text-navy">Application received</h2>
            <p className="mt-3 text-muted-foreground">Thank you. Our admissions team will contact {data.guardian_name} on {data.guardian_phone} with next steps.</p>
            <Button asChild className="mt-6 font-display font-bold uppercase"><Link to="/">Back to home</Link></Button>
          </div>
        ) : (
          <>
            <ol className="mb-8 grid grid-cols-5 gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <div className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-gold" : "bg-secondary")} />
                  <span className={cn("mt-2 hidden font-display text-sm uppercase tracking-wider sm:block", i === step ? "text-navy" : "text-muted-foreground")}>{s}</span>
                </li>
              ))}
            </ol>
            <div key={step} className="animate-rise rounded-xl border bg-card p-6 shadow-lg sm:p-8">
              <p className="font-display text-sm uppercase tracking-widest text-primary">Step {step + 1} of {STEPS.length}</p>
              <h2 className="mb-6 mt-1 text-3xl font-extrabold uppercase text-navy">{STEPS[step]}</h2>

              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { v: "Play & Study", b: "Residential schooling JSS 1 – SS 3 with daily elite training." },
                    { v: "Football Camping", b: "Intensive residential football programme, ages 9 – 22." },
                  ].map((p) => (
                    <button type="button" key={p.v} onClick={() => setData({ ...data, programme: p.v })}
                      className={cn("rounded-lg border-2 p-5 text-left transition-all", data.programme === p.v ? "border-gold bg-gold/10" : "border-border hover:border-primary")}>
                      <span className="font-display text-2xl font-bold uppercase text-navy">{p.v}</span>
                      <p className="mt-1 text-sm text-muted-foreground">{p.b}</p>
                    </button>
                  ))}
                </div>
              )}
              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <F k="player_name" label="Player's full name *" data={data} set={set} />
                  <F k="date_of_birth" label="Date of birth *" type="date" data={data} set={set} />
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <select id="gender" value={data.gender} onChange={set("gender")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <F k="position" label="Playing position" data={data} set={set} />
                  <F k="current_school" label="Current school" data={data} set={set} />
                  <F k="current_class" label="Current class (e.g. JSS 2)" data={data} set={set} />
                </div>
              )}
              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <F k="guardian_name" label="Parent / guardian name *" data={data} set={set} />
                  <F k="guardian_relationship" label="Relationship to player" data={data} set={set} />
                  <F k="guardian_phone" label="Phone / WhatsApp *" type="tel" data={data} set={set} />
                  <F k="guardian_email" label="Email" type="email" data={data} set={set} />
                  <div className="sm:col-span-2"><F k="address" label="Home address" data={data} set={set} /></div>
                </div>
              )}
              {step === 3 && (
                <div className="grid gap-4">
                  <div className="space-y-1.5"><Label htmlFor="medical_notes">Medical conditions, allergies or injuries</Label><Textarea id="medical_notes" value={data.medical_notes ?? ""} onChange={set("medical_notes")} rows={3} /></div>
                  <div className="space-y-1.5"><Label htmlFor="motivation">Why does the player want to join Buruj?</Label><Textarea id="motivation" value={data.motivation ?? ""} onChange={set("motivation")} rows={4} /></div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <dl className="grid gap-x-6 gap-y-3 rounded-lg bg-secondary p-5 sm:grid-cols-2">
                    {[["Programme", "programme"], ["Player", "player_name"], ["Date of birth", "date_of_birth"], ["Position", "position"], ["School / class", "current_school"], ["Guardian", "guardian_name"], ["Phone", "guardian_phone"], ["Email", "guardian_email"]].map(([l, k]) => (
                      <div key={k}><dt className="font-display text-xs uppercase tracking-wider text-muted-foreground">{l}</dt><dd className="font-medium text-navy">{k === "current_school" ? [data.current_school, data.current_class].filter(Boolean).join(" · ") || "—" : data[k!] || "—"}</dd></div>
                    ))}
                  </dl>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                    I am the parent / legal guardian and consent to this application and to Buruj Sports Academy contacting me.
                  </label>
                </div>
              )}

              <div className="mt-8 flex justify-between gap-3">
                <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="font-display uppercase"><ArrowLeft className="h-4 w-4" /> Back</Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={next} className="font-display font-bold uppercase">Continue <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button onClick={submit} disabled={loading} className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">{loading ? "Submitting…" : "Submit application"}</Button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function F({ k, label, type = "text", data, set }: { k: string; label: string; type?: string; data: Data; set: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={data[k] ?? ""} onChange={set(k)} />
    </div>
  );
}
