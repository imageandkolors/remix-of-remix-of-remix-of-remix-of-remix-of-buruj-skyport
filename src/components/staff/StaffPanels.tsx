import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyzeApplication,
  decideAccessRequest,
  getApplicationDocuments,
  listAccessRequests,
} from "@/lib/applications.functions";
import { listCvRequests, setCvRequestStatus } from "@/lib/cv.functions";

type Assessment = {
  summary: string;
  strengths: string[];
  missing: string[];
  questions: string[];
  assessed_at?: string;
};

export function ApplicationInsights({
  applicationId,
  saved,
  savedAt,
}: {
  applicationId: string;
  saved: unknown;
  savedAt: string | null;
}) {
  const docs = useQuery({
    queryKey: ["app-docs", applicationId],
    queryFn: () => getApplicationDocuments({ data: { applicationId } }),
  });
  const [result, setResult] = useState<Assessment | null>((saved as Assessment) ?? null);
  const [when, setWhen] = useState<string | null>(savedAt);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function run() {
    setBusy(true);
    try {
      const r = await analyzeApplication({ data: { applicationId } });
      setResult(r);
      setWhen(r.assessed_at);
      qc.invalidateQueries({ queryKey: ["staff-dashboard"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI review failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 border-t pt-5">
      <div>
        <h3 className="font-display text-lg font-bold uppercase text-primary">
          Uploaded documents
        </h3>
        {docs.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (docs.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {docs.data!.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <b>{d.label}</b>
                <span className="truncate text-muted-foreground">{d.filename}</span>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-primary underline"
                  >
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg border bg-secondary/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-navy">
            <Sparkles className="h-5 w-5 text-gold" /> AI admissions review
          </h3>
          <Button size="sm" onClick={run} disabled={busy}>
            {busy ? "Reviewing…" : result ? "Re-run review" : "Analyse with AI"}
          </Button>
        </div>
        {result ? (
          <div className="mt-3 space-y-3 text-sm">
            <p>{result.summary}</p>
            <List title="Strengths" items={result.strengths} />
            <List title="Missing or weak requirements" items={result.missing} tone="warn" />
            <List title="Suggested follow-up questions" items={result.questions} />
            {when && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(when).toLocaleString()} · AI suggestions — always verify before
                deciding.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Summarises strengths, flags missing requirements and suggests questions for the family,
            using the form answers and uploaded documents.
          </p>
        )}
      </div>
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone?: "warn" }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={tone ? "font-semibold text-destructive" : "font-semibold text-navy"}>{title}</p>
      <ul className="ml-5 list-disc">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function AccessRequestsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["access-requests"], queryFn: () => listAccessRequests() });
  async function act(id: string, action: "send" | "decline") {
    try {
      await decideAccessRequest({ data: { id, action } });
      toast.success(action === "send" ? "Sign-in link emailed to the parent" : "Request declined");
      qc.invalidateQueries({ queryKey: ["access-requests"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }
  const rows = q.data ?? [];
  return (
    <section className="mt-8 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-3xl font-extrabold uppercase text-navy">Parent portal requests</h2>
      <p className="text-sm text-muted-foreground">
        Parents can only sign in with a link you send. Check the email matches the application
        before sending.
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">No requests yet.</p>
      ) : (
        <div className="mt-4 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">
                  {r.email}
                  {r.guardian_name ? ` · ${r.guardian_name}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{r.reference_number}</span> ·{" "}
                  {r.player_name ?? "no matching application"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.matches ? (
                <Badge>Email matches</Badge>
              ) : (
                <Badge variant="destructive">No match</Badge>
              )}
              <Badge variant="secondary">{r.status}</Badge>
              {r.status !== "declined" && (
                <Button size="sm" disabled={!r.matches} onClick={() => act(r.id, "send")}>
                  {r.status === "sent" ? "Resend link" : "Send magic link"}
                </Button>
              )}
              {r.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => act(r.id, "decline")}>
                  Decline
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function CvRequestsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cv-requests"], queryFn: () => listCvRequests() });
  async function mark(id: string, status: "sent" | "declined") {
    await setCvRequestStatus({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["cv-requests"] });
  }
  const rows = q.data ?? [];
  return (
    <section className="mt-8 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-3xl font-extrabold uppercase text-navy">Player CV requests</h2>
      <p className="text-sm text-muted-foreground">
        Scouts and clubs requesting a player's verified CV. Reply by email, then mark as sent.
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">No requests yet.</p>
      ) : (
        <div className="mt-4 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">
                  {r.player_profiles?.full_name ?? "Player"} — {r.purpose}
                </p>
                <p>
                  {r.requester_name}
                  {r.role ? ` (${r.role})` : ""}, {r.organisation}
                  {r.country ? `, ${r.country}` : ""} ·{" "}
                  <a className="text-primary underline" href={`mailto:${r.email}`}>
                    {r.email}
                  </a>
                </p>
                {r.message && <p className="mt-1 text-muted-foreground">{r.message}</p>}
              </div>
              <Badge variant="secondary">{r.status}</Badge>
              {r.status === "new" && (
                <>
                  <Button size="sm" onClick={() => mark(r.id, "sent")}>
                    Mark sent
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => mark(r.id, "declined")}>
                    Decline
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
