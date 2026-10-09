import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteNews, deleteSlide, listContentAdmin, saveNews, saveSlide, type NewsItem, type SplashSlide } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [
    { title: "Content Manager — Buruj Sports Academy" },
    { name: "description", content: "Admin workspace for splash slides and news articles." },
    { property: "og:title", content: "Content Manager — Buruj Sports Academy" },
    { property: "og:description", content: "Manage splash slides and news." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContentManager,
});

function ImagePick({ folder, url, onPath }: { folder: "splash" | "news"; url: string | null; onPath: (p: string | null, preview: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  async function up(f: File) {
    if (!f.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    setBusy(true);
    const path = `${folder}/${crypto.randomUUID()}-${f.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-60)}`;
    const { error } = await supabase.storage.from("site-media").upload(path, f, { contentType: f.type });
    setBusy(false);
    if (error) { toast.error("Upload failed"); return; }
    onPath(path, URL.createObjectURL(f));
  }
  return (
    <div className="space-y-2">
      {url && <img src={url} alt="" className="h-32 w-full rounded object-cover" />}
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline" disabled={busy}><label className="cursor-pointer"><Upload className="h-4 w-4" />{busy ? "Uploading…" : url ? "Replace picture" : "Upload picture"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void up(f); }} /></label></Button>
        {url && <Button size="sm" variant="ghost" onClick={() => onPath(null, null)}><Trash2 className="h-4 w-4" />Remove</Button>}
      </div>
    </div>
  );
}

const KINDS = [["crest", "Logo crest + text"], ["image", "Picture only"], ["text", "Text only"], ["image_text", "Picture with text"]] as const;

function ContentManager() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-content"], queryFn: () => listContentAdmin() });
  const [slide, setSlide] = useState<SplashSlide | null>(null);
  const [art, setArt] = useState<NewsItem | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-content"] }); qc.invalidateQueries({ queryKey: ["news"] }); qc.invalidateQueries({ queryKey: ["splash"] }); };
  const slides = q.data?.slides ?? [];

  async function submitSlide() {
    if (!slide) return; setBusy(true);
    try { await saveSlide({ data: { id: slide.id || undefined, sort: slide.sort, kind: slide.kind as "crest", title: slide.title, subtitle: slide.subtitle, image_path: slide.image_path, bg_color: slide.bg_color, is_active: slide.is_active } }); toast.success("Slide saved"); setSlide(null); refresh(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function submitArt() {
    if (!art) return; setBusy(true);
    try { await saveNews({ data: { id: art.id || undefined, title: art.title, slug: art.slug || undefined, excerpt: art.excerpt, body: art.body, category: art.category, author: art.author, cover_path: art.cover_path, is_featured: art.is_featured, published: art.published, published_at: art.published_at } }); toast.success("Article saved"); setArt(null); refresh(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <h1 className="mt-4 text-4xl font-extrabold uppercase text-navy">Content</h1>
      {q.isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {q.error && <p className="mt-6 text-destructive">{(q.error as Error).message}</p>}

      <section className="mt-8">
        <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold uppercase text-navy">Splash slides</h2><p className="text-sm text-muted-foreground">Up to 3 active slides show when the app opens. Visitors can skip.</p></div>
          <Button disabled={slides.length >= 3} onClick={() => setSlide({ id: "", sort: slides.length, kind: "image", title: "", subtitle: "", image_path: null, image_url: null, bg_color: "#0b1f3a", is_active: true })}><Plus />Add slide</Button></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {slides.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="grid h-32 place-items-center text-navy-foreground" style={{ backgroundColor: s.bg_color }}>{s.image_url ? <img src={s.image_url} alt="" className="h-full w-full object-cover" /> : <p className="px-3 text-center font-display font-bold uppercase">{s.title}</p>}</div>
              <div className="p-3"><p className="text-sm font-semibold">{s.sort + 1}. {KINDS.find((k) => k[0] === s.kind)?.[1]} {!s.is_active && "(hidden)"}</p><p className="truncate text-xs text-muted-foreground">{s.title}</p>
                <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setSlide(s)}>Edit</Button><Button size="sm" variant="ghost" aria-label="Delete" onClick={async () => { if (confirm("Delete this slide?")) { await deleteSlide({ data: { id: s.id } }); refresh(); } }}><Trash2 className="h-4 w-4" /></Button></div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold uppercase text-navy">News articles</h2>
          <Button onClick={() => setArt({ id: "", slug: "", title: "", excerpt: "", body: "", category: "Academy", author: "", is_featured: false, published: true, published_at: null, cover_path: null, cover_url: null })}><Plus />New article</Button></div>
        <div className="mt-4 space-y-3">
          {q.data?.news.map((n) => (
            <div key={n.id} className="flex items-center gap-4 rounded-lg border bg-card p-3">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-navy">{n.cover_url && <img src={n.cover_url} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-navy">{n.title}</p><p className="text-xs text-muted-foreground">{n.category} · {n.published ? "Published" : "Draft"}{n.is_featured ? " · Lead story" : ""}</p></div>
              <Button size="sm" variant="outline" onClick={() => setArt(n)}>Edit</Button>
              <Button size="sm" variant="ghost" aria-label="Delete" onClick={async () => { if (confirm(`Delete "${n.title}"?`)) { await deleteNews({ data: { id: n.id } }); refresh(); } }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={!!slide} onOpenChange={(o) => !o && setSlide(null)}>
        <DialogContent><DialogHeader><DialogTitle>{slide?.id ? "Edit slide" : "New slide"}</DialogTitle></DialogHeader>
          {slide && <div className="grid gap-3">
            <div><Label>Slide type</Label><select className="mt-1 w-full rounded-md border bg-background p-2" value={slide.kind} onChange={(e) => setSlide({ ...slide, kind: e.target.value })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><Label>Title</Label><Input value={slide.title ?? ""} onChange={(e) => setSlide({ ...slide, title: e.target.value })} /></div>
            <div><Label>Subtitle</Label><Input value={slide.subtitle ?? ""} onChange={(e) => setSlide({ ...slide, subtitle: e.target.value })} /></div>
            <div><Label>{slide.kind === "crest" ? "Logo (optional — uses the academy crest if empty)" : "Picture"}</Label><ImagePick folder="splash" url={slide.image_url} onPath={(p, u) => setSlide({ ...slide, image_path: p, image_url: u })} /></div>
            <div className="flex gap-4"><div><Label>Background colour</Label><input type="color" className="mt-1 block h-10 w-20" value={slide.bg_color} onChange={(e) => setSlide({ ...slide, bg_color: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" min={1} max={3} value={slide.sort + 1} onChange={(e) => setSlide({ ...slide, sort: Math.max(0, Number(e.target.value) - 1) })} /></div></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slide.is_active} onChange={(e) => setSlide({ ...slide, is_active: e.target.checked })} />Show this slide</label>
            <Button disabled={busy} onClick={submitSlide}>{busy ? "Saving…" : "Save slide"}</Button>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!art} onOpenChange={(o) => !o && setArt(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{art?.id ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          {art && <div className="grid gap-3">
            <div><Label>Headline</Label><Input value={art.title} onChange={(e) => setArt({ ...art, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><Input list="news-cats" value={art.category} onChange={(e) => setArt({ ...art, category: e.target.value })} /><datalist id="news-cats">{["Academy", "Match report", "Trials", "Admissions", "Campus life", "Transfers"].map((c) => <option key={c} value={c} />)}</datalist></div>
              <div><Label>Author</Label><Input value={art.author ?? ""} onChange={(e) => setArt({ ...art, author: e.target.value })} /></div></div>
            <div><Label>Cover picture</Label><ImagePick folder="news" url={art.cover_url} onPath={(p, u) => setArt({ ...art, cover_path: p, cover_url: u })} /></div>
            <div><Label>Summary</Label><Textarea rows={2} value={art.excerpt ?? ""} onChange={(e) => setArt({ ...art, excerpt: e.target.value })} /></div>
            <div><Label>Story (leave a blank line between paragraphs)</Label><Textarea rows={10} value={art.body ?? ""} onChange={(e) => setArt({ ...art, body: e.target.value })} /></div>
            <div><Label>Publish date</Label><Input type="date" value={art.published_at?.slice(0, 10) ?? ""} onChange={(e) => setArt({ ...art, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={art.published} onChange={(e) => setArt({ ...art, published: e.target.checked })} />Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={art.is_featured} onChange={(e) => setArt({ ...art, is_featured: e.target.checked })} />Lead story on the News page</label>
            <Button disabled={busy} onClick={submitArt}>{busy ? "Saving…" : "Save article"}</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
