import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteProgramme, listProgrammesAdmin, saveProgramme } from "@/lib/programmes.functions";
import { formatFee, type Programme } from "@/lib/programmes";

export const Route = createFileRoute("/_authenticated/programmes")({
  head: () => ({ meta: [
    { title: "Programme Manager — Buruj Sports Academy" },
    { name: "description", content: "Admin workspace to edit programme fees, sessions and content." },
    { property: "og:title", content: "Programme Manager — Buruj Sports Academy" },
    { property: "og:description", content: "Edit programme content." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ProgrammeManager,
});

const BLANK: Programme = { slug: "", name: "", tagline: "", age_range: "", session_label: "", fee_amount: null, fee_period: "session", fee_confirmed: true, non_refundable: true, inclusions: [], intro: "", sections: [], trial_countries: [], note: "", cta_title: "", cta_body: "", cta_label: "", is_published: true, display_order: 0 };

function ProgrammeManager() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-programmes"], queryFn: () => listProgrammesAdmin() });
  const [edit, setEdit] = useState<Programme | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-programmes"] }); qc.invalidateQueries({ queryKey: ["programmes"] }); };

  async function remove(p: Programme) {
    if (!p.id || !confirm(`Delete ${p.name}?`)) return;
    try { await deleteProgramme({ data: { id: p.id } }); toast.success("Programme deleted"); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold uppercase text-navy">Programmes</h1>
        <Button onClick={() => setEdit({ ...BLANK })}><Plus />New programme</Button>
      </div>
      {q.isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {q.error && <p className="mt-6 text-destructive">{(q.error as Error).message}</p>}
      <div className="mt-6 space-y-3">
        {q.data?.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div>
              <p className="font-display text-xl font-bold text-navy">{p.name} {!p.is_published && <span className="text-sm text-muted-foreground">(hidden)</span>}</p>
              <p className="text-sm text-muted-foreground">{[p.age_range, p.session_label, formatFee(p)].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEdit(p)}>Edit</Button>
              <Button variant="outline" onClick={() => remove(p)} aria-label="Delete"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
      {edit && <Editor initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); }} />}
    </div>
  );
}

function Editor({ initial, onClose, onSaved }: { initial: Programme; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState(initial);
  const [sections, setSections] = useState(JSON.stringify(initial.sections, null, 2));
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Programme, v: unknown) => setP((x) => ({ ...x, [k]: v }));
  const txt = (k: keyof Programme, label: string, area = false) => (
    <div className="space-y-1"><Label>{label}</Label>
      {area ? <Textarea value={(p[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
        : <Input value={(p[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />}
    </div>
  );
  const lines = (k: "inclusions" | "trial_countries", label: string) => (
    <div className="space-y-1"><Label>{label} (one per line)</Label>
      <Textarea value={p[k].join("\n")} onChange={(e) => set(k, e.target.value.split("\n"))} /></div>
  );
  const n = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

  async function save() {
    let parsed;
    try { parsed = JSON.parse(sections || "[]"); } catch { toast.error("Sections must be valid — check the brackets and quotes"); return; }
    setBusy(true);
    try {
      await saveProgramme({ data: {
        id: p.id, slug: p.slug.trim(), name: p.name.trim(), tagline: n(p.tagline), age_range: n(p.age_range), session_label: n(p.session_label),
        fee_amount: p.fee_amount == null || (p.fee_amount as unknown) === "" ? null : Number(p.fee_amount), fee_period: n(p.fee_period),
        fee_confirmed: p.fee_confirmed, non_refundable: p.non_refundable,
        inclusions: p.inclusions.map((s) => s.trim()).filter(Boolean), trial_countries: p.trial_countries.map((s) => s.trim()).filter(Boolean),
        intro: n(p.intro), sections: parsed, note: n(p.note), cta_title: n(p.cta_title), cta_body: n(p.cta_body), cta_label: n(p.cta_label),
        is_published: p.is_published ?? true, display_order: Number(p.display_order ?? 0),
      } });
      toast.success("Programme saved"); onSaved();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{p.id ? `Edit ${p.name}` : "New programme"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("name", "Name")}{txt("slug", "Web address (e.g. football-camping)")}
          {txt("age_range", "Ages / classes")}{txt("session_label", "Session / dates")}
          <div className="space-y-1"><Label>Fee (₦)</Label><Input type="number" value={p.fee_amount ?? ""} onChange={(e) => set("fee_amount", e.target.value === "" ? null : Number(e.target.value))} /></div>
          {txt("fee_period", "Fee period (month, session…)")}
          <div className="space-y-1"><Label>Display order</Label><Input type="number" value={p.display_order ?? 0} onChange={(e) => set("display_order", Number(e.target.value))} /></div>
          <div className="flex flex-col gap-2 pt-6 text-sm">
            <label className="flex gap-2"><input type="checkbox" checked={p.fee_confirmed} onChange={(e) => set("fee_confirmed", e.target.checked)} />Show fee publicly</label>
            <label className="flex gap-2"><input type="checkbox" checked={p.non_refundable} onChange={(e) => set("non_refundable", e.target.checked)} />Non-refundable</label>
            <label className="flex gap-2"><input type="checkbox" checked={p.is_published ?? true} onChange={(e) => set("is_published", e.target.checked)} />Visible on website</label>
          </div>
        </div>
        {txt("tagline", "Tagline")}{txt("intro", "Introduction", true)}
        {lines("inclusions", "Inclusions")}{lines("trial_countries", "Trial countries")}
        <div className="space-y-1"><Label>Content sections (title, body, items)</Label><Textarea rows={8} className="font-mono text-xs" value={sections} onChange={(e) => setSections(e.target.value)} /></div>
        {txt("note", "Note", true)}{txt("cta_title", "Call-to-action title")}{txt("cta_body", "Call-to-action text", true)}{txt("cta_label", "Button label")}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}
