import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crest } from "@/components/site/Crest";
import { addPlayerItem, deletePlayerItem, getSquadPlayer, listSquad, savePlayer } from "@/lib/squad.functions";

export const Route = createFileRoute("/_authenticated/squad")({
  head: () => ({ meta: [
    { title: "Squad Manager — Buruj Sports Academy" },
    { name: "description", content: "Staff workspace to manage player profiles, statistics and development milestones." },
    { property: "og:title", content: "Squad Manager — Buruj Sports Academy" },
    { property: "og:description", content: "Manage player profiles." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SquadManager,
});

type Form = Record<string, string | boolean>;
const EMPTY: Form = { full_name: "", slug: "", jersey_number: "", position: "MID", secondary_position: "", preferred_foot: "", date_of_birth: "", joined_on: "", height_cm: "", weight_kg: "", nationality: "Nigerian", programme: "", avatar_url: "", video_cv_url: "", bio: "", cv_summary: "", overall_rating: "", pace: "", technical: "", tactical: "", physical: "", passing: "", finishing: "", is_published: false };
const NUMS = ["jersey_number", "height_cm", "weight_kg", "overall_rating", "pace", "technical", "tactical", "physical", "passing", "finishing"];
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function toPayload(f: Form, id?: string) {
  const out: Record<string, unknown> = id ? { id } : {};
  for (const [k, v] of Object.entries(f)) {
    if (k === "is_published") out[k] = v;
    else if (NUMS.includes(k)) out[k] = v === "" ? null : Number(v);
    else out[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  out["full_name"] = String(f["full_name"]); out["slug"] = String(f["slug"]); out["position"] = f["position"];
  return out;
}

function SquadManager() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["squad-admin"], queryFn: () => listSquad() });
  const [editing, setEditing] = useState<string | "new" | null>(null);

  if (list.isLoading) return <div className="grid min-h-[70vh] place-items-center text-muted-foreground">Loading squad…</div>;
  if (list.isError) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-4xl font-extrabold uppercase text-navy">Staff access required</h1><p className="mt-3 text-muted-foreground">Only coaches and admins can manage player profiles.</p><Button asChild className="mt-6"><Link to="/dashboard">Back</Link></Button></div>;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><Crest className="h-12 w-11" /><div><p className="font-display text-xs font-bold uppercase text-gold">Coaching staff</p><h1 className="font-display text-2xl font-extrabold uppercase">Squad manager</h1></div></div>
          <Button asChild variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"><Link to="/dashboard"><ArrowLeft /> Admissions</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div><h2 className="text-3xl font-extrabold uppercase text-navy">Players</h2><p className="text-sm text-muted-foreground">Only published profiles appear on the public Squad page.</p></div>
            <Button onClick={() => setEditing("new")} className="font-display font-bold uppercase"><Plus /> Add player</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Player</TableHead><TableHead>Position</TableHead><TableHead>Programme</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {(list.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-display text-lg font-bold">{p.jersey_number ?? "–"}</TableCell>
                  <TableCell className="font-semibold text-navy">{p.full_name}</TableCell>
                  <TableCell>{p.position}</TableCell>
                  <TableCell>{p.programme ?? "—"}</TableCell>
                  <TableCell><Badge variant={p.is_published ? "default" : "secondary"}>{p.is_published ? "Published" : "Draft"}</Badge></TableCell>
                  <TableCell className="space-x-2 text-right">
                    {p.is_published && <Button asChild size="sm" variant="ghost"><Link to="/players/$slug" params={{ slug: p.slug }} target="_blank"><ExternalLink /></Link></Button>}
                    <Button size="sm" variant="outline" onClick={() => setEditing(p.id)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {list.data?.length === 0 && <p className="p-10 text-center text-muted-foreground">No players yet.</p>}
        </section>
      </main>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          {editing && <Editor key={editing} id={editing === "new" ? null : editing} onSaved={(id) => { qc.invalidateQueries({ queryKey: ["squad-admin"] }); qc.invalidateQueries({ queryKey: ["players"] }); setEditing(id); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Editor({ id, onSaved }: { id: string | null; onSaved: (id: string) => void }) {
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: ["squad-player", id], queryFn: () => getSquadPlayer({ data: { id: id! } }), enabled: !!id });
  const [f, setF] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = detail.data?.player as Record<string, unknown> | undefined;
    if (!p) return;
    const next: Form = { ...EMPTY };
    for (const k of Object.keys(EMPTY)) next[k] = k === "is_published" ? Boolean(p[k]) : p[k] == null ? "" : String(p[k]);
    setF(next);
  }, [detail.data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setF((prev) => ({ ...prev, [k]: v, ...(k === "full_name" && !id ? { slug: slugify(v) } : {}) }));
  };

  async function save() {
    setSaving(true);
    try {
      const r = await savePlayer({ data: toPayload(f, id ?? undefined) as never });
      toast.success("Player saved");
      qc.invalidateQueries({ queryKey: ["squad-player", r.id] });
      qc.invalidateQueries({ queryKey: ["player", String(f["slug"])] });
      onSaved(r.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 160) : "Could not save");
    } finally { setSaving(false); }
  }

  const field = (k: string, label: string, type = "text") => (
    <div className="space-y-1"><Label htmlFor={k}>{label}</Label><Input id={k} type={type} value={String(f[k] ?? "")} onChange={set(k)} /></div>
  );

  if (id && detail.isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;

  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-3xl font-extrabold uppercase text-navy">{id ? String(f["full_name"]) || "Edit player" : "New player"}</DialogTitle></DialogHeader>
      <h3 className="font-display text-lg font-bold uppercase text-primary">Vitals</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {field("full_name", "Full name")}{field("slug", "Profile link (slug)")}{field("jersey_number", "Shirt number", "number")}
        <div className="space-y-1"><Label>Position</Label><select className={sel} value={String(f["position"])} onChange={set("position")}>{["GK", "DEF", "MID", "FWD"].map((p) => <option key={p}>{p}</option>)}</select></div>
        {field("secondary_position", "Alt. position")}
        <div className="space-y-1"><Label>Preferred foot</Label><select className={sel} value={String(f["preferred_foot"])} onChange={set("preferred_foot")}><option value="">—</option>{["Left", "Right", "Both"].map((p) => <option key={p}>{p}</option>)}</select></div>
        {field("date_of_birth", "Date of birth", "date")}{field("joined_on", "Joined academy", "date")}{field("nationality", "Nationality")}
        {field("height_cm", "Height (cm)", "number")}{field("weight_kg", "Weight (kg)", "number")}
        <div className="space-y-1"><Label>Programme</Label><select className={sel} value={String(f["programme"])} onChange={set("programme")}><option value="">—</option><option>Play & Study</option><option>Football Camping</option></select></div>
        {field("avatar_url", "Photo link (URL)")}{field("video_cv_url", "Highlight reel (YouTube/Vimeo)")}
      </div>
      <h3 className="font-display text-lg font-bold uppercase text-primary">Ratings (0–99)</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
        {[["overall_rating", "Overall"], ["pace", "Pace"], ["technical", "Technical"], ["passing", "Passing"], ["finishing", "Finish/GK"], ["physical", "Physical"], ["tactical", "Tactical"]].map(([k, l]) => <div key={k}>{field(k!, l!, "number")}</div>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Short bio</Label><Textarea rows={3} value={String(f["bio"])} onChange={set("bio")} /></div>
        <div className="space-y-1"><Label>CV / scouting summary</Label><Textarea rows={3} value={String(f["cv_summary"])} onChange={set("cv_summary")} /></div>
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(f["is_published"])} onChange={(e) => setF({ ...f, is_published: e.target.checked })} /> Publish on public Squad page</label>
        <Button onClick={save} disabled={saving} className="font-display font-bold uppercase">{saving ? "Saving…" : "Save player"}</Button>
      </div>
      {id && detail.data ? <Extras id={id} data={detail.data} /> : <p className="text-sm text-muted-foreground">Save the player first to add stats, milestones and media.</p>}
    </>
  );
}

type Detail = Awaited<ReturnType<typeof getSquadPlayer>>;

function Extras({ id, data }: { id: string; data: Detail }) {
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["squad-player", id] }); qc.invalidateQueries({ queryKey: ["player"] }); };
  const [st, setSt] = useState({ season: "", appearances: "0", minutes: "0", goals: "0", assists: "0", clean_sheets: "0", yellow_cards: "0", red_cards: "0", motm: "0" });
  const [ms, setMs] = useState({ phase: "now", title: "", description: "", event_date: "" });
  const [md, setMd] = useState({ kind: "photo", url: "", caption: "" });

  async function add(payload: Parameters<typeof addPlayerItem>[0]["data"], reset: () => void) {
    try { await addPlayerItem({ data: payload }); toast.success("Added"); reset(); refresh(); }
    catch { toast.error("Check the fields and try again"); }
  }
  async function del(table: "player_season_stats" | "player_milestones" | "player_media", itemId: string) {
    try { await deletePlayerItem({ data: { table, id: itemId } }); refresh(); } catch { toast.error("Could not delete"); }
  }
  const n = (v: string) => Number(v) || 0;
  const Del = ({ onClick }: { onClick: () => void }) => <Button size="icon" variant="ghost" onClick={onClick} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>;

  return (
    <div className="space-y-6 border-t pt-4">
      <section>
        <h3 className="font-display text-lg font-bold uppercase text-primary">Season statistics</h3>
        {data.stats.map((s) => <div key={s.id} className="flex items-center justify-between border-b py-1 text-sm"><span><b>{s.season}</b> · {s.appearances} apps · {s.goals}G {s.assists}A · {s.clean_sheets} CS · {s.motm} MOTM</span><Del onClick={() => del("player_season_stats", s.id)} /></div>)}
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-10">
          {Object.keys(st).map((k) => <Input key={k} placeholder={k.replace("_", " ")} title={k.replace("_", " ")} value={st[k as keyof typeof st]} onChange={(e) => setSt({ ...st, [k]: e.target.value })} />)}
          <Button onClick={() => add({ table: "player_season_stats", row: { player_id: id, season: st.season, appearances: n(st.appearances), minutes: n(st.minutes), goals: n(st.goals), assists: n(st.assists), clean_sheets: n(st.clean_sheets), yellow_cards: n(st.yellow_cards), red_cards: n(st.red_cards), motm: n(st.motm) } }, () => setSt({ ...st, season: "" }))}>Save</Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Season e.g. 2025/26. Saving an existing season updates it.</p>
      </section>
      <section>
        <h3 className="font-display text-lg font-bold uppercase text-primary">Before · Now · Future milestones</h3>
        {data.milestones.map((m) => <div key={m.id} className="flex items-center justify-between border-b py-1 text-sm"><span><Badge variant="secondary" className="mr-2 uppercase">{m.phase}</Badge>{m.title}{m.event_date ? ` · ${m.event_date}` : ""}</span><Del onClick={() => del("player_milestones", m.id)} /></div>)}
        <div className="mt-2 grid gap-2 sm:grid-cols-[110px_1fr_1fr_150px_auto]">
          <select className={sel} value={ms.phase} onChange={(e) => setMs({ ...ms, phase: e.target.value })}><option value="before">Before</option><option value="now">Now</option><option value="future">Future</option></select>
          <Input placeholder="Title" value={ms.title} onChange={(e) => setMs({ ...ms, title: e.target.value })} />
          <Input placeholder="Description" value={ms.description} onChange={(e) => setMs({ ...ms, description: e.target.value })} />
          <Input type="date" value={ms.event_date} onChange={(e) => setMs({ ...ms, event_date: e.target.value })} />
          <Button onClick={() => add({ table: "player_milestones", row: { player_id: id, phase: ms.phase as "now", title: ms.title, description: ms.description || null, event_date: ms.event_date || null, sort: data.milestones.length + 1 } }, () => setMs({ ...ms, title: "", description: "", event_date: "" }))}>Add</Button>
        </div>
      </section>
      <section>
        <h3 className="font-display text-lg font-bold uppercase text-primary">Photos & video clips</h3>
        {data.media.map((m) => <div key={m.id} className="flex items-center justify-between border-b py-1 text-sm"><span className="truncate"><Badge variant="secondary" className="mr-2 uppercase">{m.kind}</Badge>{m.caption || m.url}</span><Del onClick={() => del("player_media", m.id)} /></div>)}
        <div className="mt-2 grid gap-2 sm:grid-cols-[110px_1fr_1fr_auto]">
          <select className={sel} value={md.kind} onChange={(e) => setMd({ ...md, kind: e.target.value })}><option value="photo">Photo</option><option value="video">Video</option></select>
          <Input placeholder="Link (image URL or YouTube/Vimeo)" value={md.url} onChange={(e) => setMd({ ...md, url: e.target.value })} />
          <Input placeholder="Caption" value={md.caption} onChange={(e) => setMd({ ...md, caption: e.target.value })} />
          <Button onClick={() => add({ table: "player_media", row: { player_id: id, kind: md.kind as "photo", url: md.url, caption: md.caption || null, sort: data.media.length + 1 } }, () => setMd({ ...md, url: "", caption: "" }))}>Add</Button>
        </div>
      </section>
    </div>
  );
}
