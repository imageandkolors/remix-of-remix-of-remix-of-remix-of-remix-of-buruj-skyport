import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, CircleAlert, FileText, LogOut, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUploader } from "@/components/site/DocumentUploader";
import {
  DOCUMENT_TYPES,
  getMyPortal,
  requestParentAccess,
  updateMyContact,
} from "@/lib/applications.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Parent Portal — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "Families track application progress, upload outstanding documents and update contact details.",
      },
      { property: "og:title", content: "Parent Portal — Buruj Sports Academy" },
      { property: "og:description", content: "Secure family access to Buruj admissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portal,
});

const STEPS = ["Submitted", "Under review", "Shortlisted / trial", "Accepted"];

function Portal() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <section className="bg-navy py-16 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="font-display uppercase tracking-[0.3em] text-gold">Families</p>
          <h1 className="mt-3 text-5xl font-extrabold uppercase leading-[0.9]">Parent portal</h1>
          <p className="mt-4 max-w-xl text-navy-foreground/80">
            Follow your child's application, upload missing documents and keep your contact details
            current.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {!ready ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : session ? (
          <Dashboard />
        ) : (
          <RequestAccess />
        )}
      </section>
    </>
  );
}

function RequestAccess() {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestParentAccess({ data: { email, reference, name } });
      setSent(true);
    } catch {
      toast.error("Check the email and reference number");
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div className="rounded-xl border-t-4 border-gold bg-card p-8 text-center shadow-lg">
        <MailCheck className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-3xl font-extrabold uppercase text-navy">Request received</h2>
        <p className="mt-2 text-muted-foreground">
          Our admissions team will check your details and email you a secure sign-in link. Open it
          on this device to enter the portal.
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-6 shadow-lg sm:p-8">
      <div>
        <h2 className="text-3xl font-extrabold uppercase text-navy">Request a sign-in link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the guardian email you gave on the application. Admissions sends your link after
          checking it — there are no passwords.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pname">Your name</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pemail">Guardian email *</Label>
        <Input
          id="pemail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pref">Application reference *</Label>
        <Input
          id="pref"
          required
          placeholder="BSA-2026-XXXXXXXX"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <Button disabled={busy} className="justify-self-start font-display font-bold uppercase">
        {busy ? "Sending…" : "Request sign-in link"}
      </Button>
    </form>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["portal"], queryFn: () => getMyPortal() });
  async function signOut() {
    qc.removeQueries({ queryKey: ["portal"] });
    await supabase.auth.signOut();
  }
  if (q.isLoading) return <p className="text-muted-foreground">Loading your applications…</p>;
  if (q.isError || !q.data)
    return (
      <div className="text-center">
        <p className="text-muted-foreground">We couldn't load your portal.</p>
        <Button onClick={signOut} variant="outline" className="mt-4">
          Sign out
        </Button>
      </div>
    );
  const header = (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Signed in as <b>{q.data.email}</b>
      </p>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
  if (!q.data.approved || q.data.applications.length === 0)
    return (
      <>
        {header}
        <div className="rounded-xl border bg-card p-8 text-center">
          <CircleAlert className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 text-muted-foreground">
            No approved applications are linked to this email yet. Request access with your
            reference number and admissions will confirm it.
          </p>
        </div>
        <div className="mt-6">
          <RequestAccess />
        </div>
      </>
    );
  return (
    <>
      {header}
      <div className="space-y-8">
        {q.data.applications.map((a) => (
          <AppCard
            key={a.id}
            app={a}
            refresh={() => qc.invalidateQueries({ queryKey: ["portal"] })}
          />
        ))}
      </div>
    </>
  );
}

type App = Awaited<ReturnType<typeof getMyPortal>>["applications"][number];

function AppCard({ app, refresh }: { app: App; refresh: () => void }) {
  const [phone, setPhone] = useState(app.guardian_phone ?? "");
  const [address, setAddress] = useState(app.address ?? "");
  const [saving, setSaving] = useState(false);
  const declined = app.status === "declined";
  async function save() {
    setSaving(true);
    try {
      await updateMyContact({ data: { applicationId: app.id, guardian_phone: phone, address } });
      toast.success("Contact details updated");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl font-extrabold uppercase text-navy">{app.player_name}</h2>
        <span className="font-mono text-sm">{app.reference_number}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {app.programme} · submitted {new Date(app.created_at).toLocaleDateString()}
      </p>

      {declined ? (
        <p className="mt-6 rounded-md bg-destructive/10 p-4 text-sm">
          This application was not successful this time. Admissions can explain next options — reply
          to their message or contact us.
        </p>
      ) : (
        <ol className="mt-6 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div
                className={cn(
                  "mx-auto grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold",
                  i <= app.step
                    ? "border-gold bg-gold text-gold-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {i < app.step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p
                className={cn(
                  "mt-2 text-xs font-semibold uppercase",
                  i === app.step ? "text-navy" : "text-muted-foreground",
                )}
              >
                {s}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-bold uppercase text-primary">
            Outstanding requirements
          </h3>
          {app.outstanding.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" /> Everything we need has been received.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {app.outstanding.map((o) => (
                <li key={o} className="flex gap-2">
                  <CircleAlert className="h-4 w-4 shrink-0 text-gold" />
                  {o}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 font-display text-lg font-bold uppercase text-primary">
            Uploaded documents
          </h3>
          {app.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {app.documents.map((d) => (
                <li key={d.id} className="flex gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  {DOCUMENT_TYPES[d.document_type as keyof typeof DOCUMENT_TYPES] ??
                    d.document_type}{" "}
                  · <span className="truncate text-muted-foreground">{d.original_filename}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <DocumentUploader
              applicationId={app.id}
              reference={app.reference_number}
              onUploaded={refresh}
            />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold uppercase text-primary">Contact details</h3>
          <div className="space-y-1.5">
            <Label>Phone / WhatsApp</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
          <div className="space-y-1.5">
            <Label>Home address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} />
          </div>
          <p className="text-xs text-muted-foreground">
            To change the guardian email, contact admissions.
          </p>
          <Button onClick={save} disabled={saving} className="font-display font-bold uppercase">
            {saving ? "Saving…" : "Save details"}
          </Button>
        </div>
      </div>
    </article>
  );
}
