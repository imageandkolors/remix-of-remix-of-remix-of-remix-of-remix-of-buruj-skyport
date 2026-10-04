import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, LogOut, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import logoAsset from "@/assets/buruj-logo.png.asset.json";
import { getStaffDashboard, updateApplicationReview } from "@/lib/staff.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Admissions Dashboard — Buruj Sports Academy" },
    { name: "description", content: "Secure admissions review workspace for Buruj Sports Academy staff." },
    { property: "og:title", content: "Admissions Dashboard — Buruj Sports Academy" },
    { property: "og:description", content: "Secure admissions review workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  declined: "Declined",
};

type Application = Awaited<ReturnType<typeof getStaffDashboard>>["applications"][number];

function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["staff-dashboard"], queryFn: () => getStaffDashboard() });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("submitted");
  const [reviewerId, setReviewerId] = useState("unassigned");
  const [notes, setNotes] = useState("");

  const applications = query.data?.applications ?? [];
  const filtered = useMemo(() => applications.filter((item) => {
    const term = search.toLowerCase().trim();
    const matchesText = !term || [item.player_name, item.guardian_name, item.reference_number, item.programme].some((value) => value?.toLowerCase().includes(term));
    return matchesText && (filter === "all" || item.status === filter);
  }), [applications, filter, search]);
  const canManage = query.data?.role === "admin" || query.data?.role === "owner";

  function openApplication(application: Application) {
    setSelected(application);
    setStatus(application.status);
    setReviewerId(application.reviewer_id ?? "unassigned");
    setNotes(application.admin_notes ?? "");
  }

  async function saveReview() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await updateApplicationReview({ data: {
        applicationId: selected.id,
        status: status as "submitted" | "under_review" | "shortlisted" | "accepted" | "declined",
        reviewerId: reviewerId === "unassigned" ? null : reviewerId,
        adminNotes: notes,
      } });
      await queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      setSelected(result.application);
      toast.success(result.notificationPending ? "Application updated; guardian email is awaiting sender setup" : "Application updated");
    } catch {
      toast.error("The application could not be updated");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/dashboard" }, replace: true });
  }

  if (query.isLoading) return <div className="grid min-h-[70vh] place-items-center text-muted-foreground">Loading admissions workspace…</div>;
  if (query.isError || !query.data) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-4xl font-extrabold uppercase text-navy">Staff access required</h1><p className="mt-3 text-muted-foreground">Your account does not have permission to view admissions.</p><Button onClick={signOut} className="mt-6">Return to sign in</Button></div>;

  const submittedCount = applications.filter((item) => item.status === "submitted").length;
  const activeCount = applications.filter((item) => ["under_review", "shortlisted"].includes(item.status)).length;
  const assignedCount = applications.filter((item) => item.reviewer_id === query.data.userId).length;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><img src={logoAsset.url} alt="Buruj Sports Academy" className="h-12 w-auto rounded bg-white px-2 py-1" /><div><p className="font-display text-xs font-bold uppercase text-gold">Admissions</p><h1 className="font-display text-2xl font-extrabold uppercase">Staff dashboard</h1></div></div>
          <div className="flex items-center gap-3"><Badge className="bg-gold text-gold-foreground hover:bg-gold">{query.data.role}</Badge><Button asChild className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"><Link to="/squad">Squad manager</Link></Button><Button asChild variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"><Link to="/programmes">Programmes</Link></Button><Button variant="outline" onClick={signOut} className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"><LogOut /> Sign out</Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric icon={ClipboardList} label="New submissions" value={submittedCount} />
          <Metric icon={CalendarDays} label="In review" value={activeCount} />
          <Metric icon={UserCheck} label="Assigned to you" value={assignedCount} />
        </div>

        <section className="mt-8 rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-3xl font-extrabold uppercase text-navy">Applications</h2><p className="text-sm text-muted-foreground">{canManage ? "Assign reviewers and manage decisions." : "View applications assigned to you."}</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or reference" className="pl-9 sm:w-64" /></div>
              <Select value={filter} onValueChange={setFilter}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Player</TableHead><TableHead>Programme</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Review</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((application) => <TableRow key={application.id}><TableCell className="font-mono text-xs font-semibold">{application.reference_number}</TableCell><TableCell><p className="font-semibold text-navy">{application.player_name}</p><p className="text-xs text-muted-foreground">{application.guardian_name}</p></TableCell><TableCell>{application.programme}</TableCell><TableCell><StatusBadge status={application.status} /></TableCell><TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openApplication(application)}>Open</Button></TableCell></TableRow>)}</TableBody>
          </Table>
          {filtered.length === 0 && <p className="p-10 text-center text-muted-foreground">No applications match this view.</p>}
        </section>
      </main>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selected && <><DialogHeader><DialogTitle className="font-display text-3xl font-extrabold uppercase text-navy">{selected.player_name}</DialogTitle><DialogDescription>{selected.reference_number} · {selected.programme}</DialogDescription></DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <div><h3 className="font-display text-lg font-bold uppercase text-primary">Player & guardian</h3><Detail label="Date of birth" value={selected.date_of_birth} /><Detail label="Position" value={selected.position} /><Detail label="School" value={[selected.current_school, selected.current_class].filter(Boolean).join(" · ")} /><Detail label="Guardian" value={selected.guardian_name} /><Detail label="Phone" value={selected.guardian_phone} /><Detail label="Email" value={selected.guardian_email} /></div>
              <div><h3 className="font-display text-lg font-bold uppercase text-primary">Application</h3><Detail label="Motivation" value={selected.motivation} /><Detail label="Medical notes" value={selected.medical_notes} /><Detail label="Address" value={selected.address} /></div>
            </div>
            <div className="grid gap-4 border-t pt-5 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Status</Label><Select value={status} onValueChange={setStatus} disabled={!canManage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Assigned reviewer</Label><Select value={reviewerId} onValueChange={setReviewerId} disabled={!canManage}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{query.data.reviewers.map((reviewer) => <SelectItem key={reviewer.id} value={reviewer.id}>{reviewer.full_name ?? "Unnamed staff member"} · {reviewer.role}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5 md:col-span-2"><Label htmlFor="review-notes">Internal review notes</Label><Textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canManage} rows={5} /></div>
            </div>
            {canManage && <div className="flex justify-end"><Button onClick={saveReview} disabled={saving} className="font-display font-bold uppercase">{saving ? "Saving…" : "Save review"}</Button></div>}
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: number }) {
  return <Card className="rounded-lg shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-display text-4xl font-extrabold text-navy">{value}</p></div><span className="grid h-11 w-11 place-items-center rounded-md bg-secondary text-primary"><Icon /></span></CardContent></Card>;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "declined" ? "destructive" : status === "accepted" ? "default" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div className="mt-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="whitespace-pre-wrap text-sm text-foreground">{value || "—"}</p></div>;
}