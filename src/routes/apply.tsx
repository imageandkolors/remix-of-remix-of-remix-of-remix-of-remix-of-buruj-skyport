import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ArrowLeft, ArrowRight, ClipboardCheck, Clock3, PhoneCall } from "lucide-react";
import { programmesQuery } from "@/lib/queries";
import { submitApplication } from "@/lib/applications.functions";
import { DocumentUploader } from "@/components/site/DocumentUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apply")({
  validateSearch: (s: Record<string, unknown>): { programme?: string } =>
    typeof s["programme"] === "string" ? { programme: s["programme"].slice(0, 120) } : {},
  head: () => ({
    meta: [
      { title: "Apply Online — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "Complete the Buruj Sports Academy online application for Football & Education, Football Development or Football Camping in a few simple steps, and save to continue later.",
      },
      { property: "og:title", content: "Apply Online — Buruj Sports Academy" },
      {
        property: "og:description",
        content: "Multi-step online application with save-and-continue and document uploads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Apply,
});

type Data = Record<string, string>;
const STEPS = ["Programme", "Player", "Guardian", "Health & goals", "Review"] as const;

const stepSchemas = [
  z.object({ programme: z.string().min(2, "Choose a programme") }),
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

const DRAFT_KEY = "buruj-apply-draft-v1";

function Apply() {
  const search = Route.useSearch();
  const programmes = useQuery(programmesQuery);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({ programme: search.programme ?? "", gender: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; reference_number: string } | null>(null);
  const [draftFound, setDraftFound] = useState<{ data: Data; step: number; saved: string } | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);
  const reference = submitted?.reference_number ?? null;
  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setData({ ...data, [k]: e.target.value });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraftFound(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || submitted || draftFound) return;
    const filled = Object.entries(data).some(([k, v]) => k !== "programme" && k !== "gender" && v);
    if (!filled) return;
    const t = setTimeout(
      () =>
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ data, step, saved: new Date().toISOString() }),
        ),
      400,
    );
    return () => clearTimeout(t);
  }, [data, step, hydrated, submitted, draftFound]);

  function resume() {
    if (draftFound) {
      setData({ ...draftFound.data, ...(search.programme ? { programme: search.programme } : {}) });
      setStep(draftFound.step);
    }
    setDraftFound(null);
    toast.success("Saved application restored");
  }
  function discard() {
    localStorage.removeItem(DRAFT_KEY);
    setDraftFound(null);
  }
  function saveForLater() {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ data, step, saved: new Date().toISOString() }),
    );
    toast.success("Saved on this device — come back any time to continue");
  }

  function next() {
    const r = stepSchemas[step]!.safeParse(data);
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Check this step");
      return;
    }
    setStep(step + 1);
  }

  async function submit() {
    if (!consent) {
      toast.error("Please confirm guardian consent");
      return;
    }
    setLoading(true);
    const n = (k: string) => data[k]?.trim() || null;
    try {
      const row = await submitApplication({
        data: {
          programme: data["programme"]!,
          player_name: data["player_name"]!.trim(),
          date_of_birth: n("date_of_birth"),
          gender: n("gender"),
          position: n("position"),
          current_school: n("current_school"),
          current_class: n("current_class"),
          guardian_name: data["guardian_name"]!.trim(),
          guardian_relationship: n("guardian_relationship"),
          guardian_phone: data["guardian_phone"]!.trim(),
          guardian_email: n("guardian_email"),
          address: n("address"),
          medical_notes: n("medical_notes"),
          motivation: n("motivation"),
          consent: true,
        },
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(row);
    } catch {
      toast.error("Could not submit your application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">
            Online application
          </p>
          <h1 className="animate-rise mt-3 text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl">
            Apply to Buruj
          </h1>
          <p className="animate-rise mt-4 max-w-xl text-lg text-navy-foreground/80">
            Five short steps. Every application is reviewed by our admissions team.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {reference ? (
          <div className="animate-rise rounded-lg border-t-4 border-gold bg-card p-7 shadow-xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h2 className="mt-5 text-4xl font-extrabold uppercase text-navy">
                Application received
              </h2>
              <p className="mt-2 text-muted-foreground">
                Keep this reference number for every conversation with admissions.
              </p>
              <p className="mx-auto mt-5 w-fit rounded-md bg-navy px-5 py-3 font-mono text-xl font-bold text-navy-foreground">
                {reference}
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <NextStep
                icon={ClipboardCheck}
                title="Review"
                text="Admissions checks the submitted details and documents."
              />
              <NextStep
                icon={PhoneCall}
                title="Contact"
                text={`We will contact ${data["guardian_name"]} using ${data["guardian_phone"]}.`}
              />
              <NextStep
                icon={Clock3}
                title="Decision"
                text="Shortlisted players receive trial or enrolment instructions."
              />
            </div>
            {submitted && (
              <div className="mt-8 rounded-md border p-5">
                <p className="font-display text-lg font-bold uppercase text-navy">
                  Upload documents now
                </p>
                <p className="mb-3 text-sm text-muted-foreground">
                  Birth certificate, passport photograph and medical report
                  {/education/i.test(data["programme"] ?? "")
                    ? ", plus the latest school report"
                    : ""}
                  . Take a photo or choose a file from your phone or computer. You can also upload
                  later from the Parent portal.
                </p>
                <DocumentUploader
                  applicationId={submitted.id}
                  reference={submitted.reference_number}
                />
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="font-display font-bold uppercase">
                <Link to="/portal">Parent portal</Link>
              </Button>
              <Button asChild className="font-display font-bold uppercase">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {draftFound && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-gold bg-card p-4 shadow">
                <p className="text-sm">
                  <b>You have a saved application</b>
                  {draftFound.data["player_name"]
                    ? ` for ${draftFound.data["player_name"]}`
                    : ""}{" "}
                  from {new Date(draftFound.saved).toLocaleString()}.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={resume}>
                    Continue where I left off
                  </Button>
                  <Button size="sm" variant="outline" onClick={discard}>
                    Start fresh
                  </Button>
                </div>
              </div>
            )}
            <ol className="mb-8 grid grid-cols-5 gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      i <= step ? "bg-gold" : "bg-secondary",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2 hidden font-display text-sm uppercase tracking-wider sm:block",
                      i === step ? "text-navy" : "text-muted-foreground",
                    )}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ol>
            <div key={step} className="animate-rise rounded-xl border bg-card p-6 shadow-lg sm:p-8">
              <p className="font-display text-sm uppercase tracking-widest text-primary">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mb-6 mt-1 text-3xl font-extrabold uppercase text-navy">
                {STEPS[step]}
              </h2>

              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(programmes.data ?? [])
                    .map((pr) => ({
                      v: pr.name,
                      b: [pr.age_range, pr.tagline].filter(Boolean).join(" · "),
                    }))
                    .map((p) => (
                      <button
                        type="button"
                        key={p.v}
                        onClick={() => setData({ ...data, programme: p.v })}
                        className={cn(
                          "rounded-lg border-2 p-5 text-left transition-all",
                          data["programme"] === p.v
                            ? "border-gold bg-gold/10"
                            : "border-border hover:border-primary",
                        )}
                      >
                        <span className="font-display text-2xl font-bold uppercase text-navy">
                          {p.v}
                        </span>
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
                    <select
                      id="gender"
                      value={data["gender"]}
                      onChange={set("gender")}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
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
                  <F
                    k="guardian_relationship"
                    label="Relationship to player"
                    data={data}
                    set={set}
                  />
                  <F
                    k="guardian_phone"
                    label="Phone / WhatsApp *"
                    type="tel"
                    data={data}
                    set={set}
                  />
                  <F k="guardian_email" label="Email" type="email" data={data} set={set} />
                  <div className="sm:col-span-2">
                    <F k="address" label="Home address" data={data} set={set} />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="medical_notes">Medical conditions, allergies or injuries</Label>
                    <Textarea
                      id="medical_notes"
                      value={data["medical_notes"] ?? ""}
                      onChange={set("medical_notes")}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motivation">Why does the player want to join Buruj?</Label>
                    <Textarea
                      id="motivation"
                      value={data["motivation"] ?? ""}
                      onChange={set("motivation")}
                      rows={4}
                    />
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <dl className="grid gap-x-6 gap-y-3 rounded-lg bg-secondary p-5 sm:grid-cols-2">
                    {[
                      ["Programme", "programme"],
                      ["Player", "player_name"],
                      ["Date of birth", "date_of_birth"],
                      ["Position", "position"],
                      ["School / class", "current_school"],
                      ["Guardian", "guardian_name"],
                      ["Phone", "guardian_phone"],
                      ["Email", "guardian_email"],
                    ].map(([l, k]) => (
                      <div key={k}>
                        <dt className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                          {l}
                        </dt>
                        <dd className="font-medium text-navy">
                          {k === "current_school"
                            ? [data["current_school"], data["current_class"]]
                                .filter(Boolean)
                                .join(" · ") || "—"
                            : data[k!] || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    I am the parent / legal guardian and consent to this application and to Buruj
                    Sports Academy contacting me.
                  </label>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                    className="min-w-0 font-display uppercase"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button onClick={next} className="min-w-0 font-display font-bold uppercase">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submit}
                      disabled={loading}
                      className="min-w-0 bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"
                    >
                      {loading ? "Submitting…" : "Submit"}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={saveForLater}
                  className="w-full font-display uppercase"
                >
                  Save & continue later
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function NextStep({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-md border bg-secondary p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-display text-lg font-bold uppercase text-navy">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function F({
  k,
  label,
  type = "text",
  data,
  set,
}: {
  k: string;
  label: string;
  type?: string;
  data: Data;
  set: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={data[k] ?? ""} onChange={set(k)} />
    </div>
  );
}
