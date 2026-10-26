import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteNews, listContentAdmin, saveNews, type NewsItem } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [
    { title: "Content Manager — Buruj Sports Academy" },
    { name: "description", content: "Admin workspace for news articles." },
    { property: "og:title", content: "Content Manager — Buruj Sports Academy" },
    { property: "og:description", content: "Manage news articles." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContentManager,
});

function ImagePick({ folder, url, onPath }: { folder: "news" | "social"; url: string | null; onPath: (p: string | null, preview: string | null) => void }) {
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="sm" variant="outline" disabled={busy} className="w-full sm:w-auto">
          <label className="flex cursor-pointer items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : url ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && up(e.target.files[0])} />
          </label>
        </Button>
        {url && <Button size="sm" variant="ghost" onClick={() => onPath(null, null)} className="w-full sm:w-auto"><Trash2 className="h-4 w-4" />Remove</Button>}
      </div>
    </div>
  );
}

function getPublishStatus(item: Pick<NewsItem, "published" | "is_featured" | "published_at">) {
  if (!item.published && item.published_at) return "Scheduled";
  if (!item.published) return "Draft";
  if (item.is_featured) return "Featured";
  return "Published";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Featured":
      return "bg-gold text-gold-foreground";
    case "Published":
      return "bg-emerald-100 text-emerald-800";
    case "Scheduled":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

function getSeoScore(article: Partial<NewsItem>) {
  const title = (article.meta_title || article.title || "").trim();
  const description = (article.meta_description || article.excerpt || "").trim();
  const hasImage = Boolean(article.cover_path || article.social_image_path);
  const hasCanonical = Boolean(article.canonical_url?.trim());
  const hasAuthor = Boolean(article.author || article.seo_author);
  const hasBody = Boolean((article.body || "").trim());

  let score = 0;
  score += title.length >= 45 && title.length <= 60 ? 28 : title.length > 0 ? 16 : 0;
  score += description.length >= 120 && description.length <= 160 ? 27 : description.length > 0 ? 14 : 0;
  score += hasImage ? 14 : 0;
  score += hasCanonical ? 10 : 0;
  score += hasAuthor ? 11 : 0;
  score += hasBody ? 10 : 0;
  return Math.max(0, Math.min(100, score));
}

function newArticleDraft(): NewsItem {
  return {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    category: "Academy",
    author: "",
    is_featured: false,
    published: true,
    published_at: null,
    cover_path: null,
    cover_url: null,
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    social_image_path: null,
    social_image_url: null,
    seo_author: "",
    article_section: "",
    schema_publisher: "Buruj Sports Academy",
  };
}

function ContentManager() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-content"], queryFn: () => listContentAdmin() });
  const [art, setArt] = useState<NewsItem | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-content"] }); qc.invalidateQueries({ queryKey: ["news"] }); };

  async function submitArt() {
    if (!art) return;
    setBusy(true);
    try {
      await saveNews({ data: {
        id: art.id || undefined,
        title: art.title,
        slug: art.slug || undefined,
        excerpt: art.excerpt,
        body: art.body,
        category: art.category,
        author: art.author,
        cover_path: art.cover_path,
        social_image_path: art.social_image_path,
        is_featured: art.is_featured,
        published: art.published,
        published_at: art.published_at,
        meta_title: art.meta_title,
        meta_description: art.meta_description,
        canonical_url: art.canonical_url,
        seo_author: art.seo_author,
        article_section: art.article_section,
        schema_publisher: art.schema_publisher,
      } });
      toast.success("Story saved");
      setArt(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const listCards = useMemo(() => q.data?.news ?? [], [q.data?.news]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Blog & news</p>
          <h1 className="mt-1 text-3xl font-extrabold uppercase text-navy sm:text-4xl">Content</h1>
        </div>
        <Button onClick={() => setArt(newArticleDraft())} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New story
        </Button>
      </div>

      {q.isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {q.error && <p className="mt-6 text-destructive">{(q.error as Error).message}</p>}

      <section className="mt-8 rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold uppercase text-navy">News articles</h2>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{listCards.length} total</span>
        </div>

        <div className="space-y-3 p-4">
          {listCards.map((n) => {
            const status = getPublishStatus(n);
            const seoScore = getSeoScore(n);
            const articleTitle = n.meta_title || n.title || "Untitled article";
            const articleDescription = n.meta_description || n.excerpt || "No description yet";
            return (
              <div key={n.id} className="flex flex-col gap-4 rounded-lg border bg-background/60 p-3 sm:flex-row sm:items-center">
                <div className="h-20 w-full shrink-0 overflow-hidden rounded bg-navy sm:h-16 sm:w-24">{n.cover_url && <img src={n.cover_url} alt="" className="h-full w-full object-cover" />}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{n.category}</span>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getStatusClasses(status)}`}>{status}</span>
                    {n.is_featured && <span className="rounded bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-foreground">Featured</span>}
                  </div>
                  <p className="mt-2 truncate font-semibold text-navy">{n.title || "Untitled article"}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{articleDescription}</p>
                </div>

                <div className="w-full sm:max-w-[190px]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <span>SEO</span>
                    <span>{seoScore}/100</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500" style={{ width: `${seoScore}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {articleTitle.length}/60 title · {articleDescription.length}/160 desc
                  </div>
                </div>

                <div className="flex gap-2 sm:ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setArt(n)} className="flex-1 sm:flex-none">Edit</Button>
                  <Button size="sm" variant="ghost" aria-label="Delete" onClick={async () => { if (confirm(`Delete "${n.title}"?`)) { await deleteNews({ data: { id: n.id } }); refresh(); } }} className="flex-1 sm:flex-none"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog open={!!art} onOpenChange={(o) => !o && setArt(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle>{art?.id ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          {art && (() => {
            const status = getPublishStatus(art);
            const seoScore = getSeoScore(art);
            const titleValue = art.meta_title || art.title || "Untitled article";
            const descriptionValue = art.meta_description || art.excerpt || "Add a meta description for better visibility.";
            const previewImage = art.social_image_url || art.cover_url;

            return (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{art.category || "Academy"}</span>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getStatusClasses(status)}`}>{status}</span>
                      {art.is_featured && <span className="rounded bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-foreground">Featured</span>}
                    </div>
                  </div>

                  <div>
                    <Label>Headline</Label>
                    <Input value={art.title} onChange={(e) => setArt({ ...art, title: e.target.value })} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Category</Label>
                      <Input list="news-cats" value={art.category} onChange={(e) => setArt({ ...art, category: e.target.value })} />
                      <datalist id="news-cats"><option value="Academy" /><option value="Matchday" /><option value="Trials" /><option value="Community" /></datalist>
                    </div>
                    <div>
                      <Label>Author</Label>
                      <Input value={art.author ?? ""} onChange={(e) => setArt({ ...art, author: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Cover picture</Label>
                    <ImagePick folder="news" url={art.cover_url} onPath={(p, u) => setArt({ ...art, cover_path: p, cover_url: u })} />
                  </div>

                  <div>
                    <Label>Summary</Label>
                    <Textarea rows={2} value={art.excerpt ?? ""} onChange={(e) => setArt({ ...art, excerpt: e.target.value })} />
                  </div>

                  <div>
                    <Label>Story</Label>
                    <Textarea rows={10} value={art.body ?? ""} onChange={(e) => setArt({ ...art, body: e.target.value })} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Publish date</Label>
                      <Input type="date" value={art.published_at?.slice(0, 10) ?? ""} onChange={(e) => setArt({ ...art, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                    <div className="flex flex-col justify-center gap-2 rounded-md border p-3">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={art.published} onChange={(e) => setArt({ ...art, published: e.target.checked })} />Published</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={art.is_featured} onChange={(e) => setArt({ ...art, is_featured: e.target.checked })} />Lead story on homepage</label>
                    </div>
                  </div>
                </div>

                <aside className="space-y-4 rounded-lg border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <p className="font-display text-xl font-bold uppercase text-navy">SEO settings</p>
                      <p className="mt-1 text-xs text-muted-foreground">Search and social optimization</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Score {seoScore}</span>
                  </div>

                  <div>
                    <Label>Meta title</Label>
                    <Input value={art.meta_title ?? ""} onChange={(e) => setArt({ ...art, meta_title: e.target.value })} placeholder={art.title || "Article title"} />
                    <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Title length</span><span>{(art.meta_title || art.title || "").length}/60</span></div>
                  </div>

                  <div>
                    <Label>Meta description</Label>
                    <Textarea rows={3} value={art.meta_description ?? ""} onChange={(e) => setArt({ ...art, meta_description: e.target.value })} placeholder="Short excerpt used by Google and social previews" />
                    <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>Description length</span><span>{(art.meta_description || art.excerpt || "").length}/160</span></div>
                  </div>

                  <div>
                    <Label>Canonical URL</Label>
                    <Input value={art.canonical_url ?? ""} onChange={(e) => setArt({ ...art, canonical_url: e.target.value })} placeholder="https://example.com/news/your-story" />
                  </div>

                  <div>
                    <Label>Social thumbnail</Label>
                    <ImagePick folder="social" url={art.social_image_url} onPath={(p, u) => setArt({ ...art, social_image_path: p, social_image_url: u })} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <Label>SEO author</Label>
                      <Input value={art.seo_author ?? ""} onChange={(e) => setArt({ ...art, seo_author: e.target.value })} placeholder={art.author || "Buruj Media Team"} />
                    </div>
                    <div>
                      <Label>Article section</Label>
                      <Input value={art.article_section ?? ""} onChange={(e) => setArt({ ...art, article_section: e.target.value })} placeholder={art.category || "Academy"} />
                    </div>
                    <div className="sm:col-span-2 xl:col-span-1">
                      <Label>Schema publisher</Label>
                      <Input value={art.schema_publisher ?? ""} onChange={(e) => setArt({ ...art, schema_publisher: e.target.value })} placeholder="Buruj Sports Academy" />
                    </div>
                  </div>

                  <div className="rounded-md border bg-background p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                    <div className="mt-3 overflow-hidden rounded-md border bg-card">
                      {previewImage ? <img src={previewImage} alt="" className="h-24 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-muted text-xs text-muted-foreground">No image</div>}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-navy">{titleValue}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{descriptionValue}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <span className={`rounded px-2 py-1 ${getStatusClasses(status)}`}>{status}</span>
                      {art.is_featured && <span className="rounded bg-gold px-2 py-1 text-gold-foreground">Featured</span>}
                    </div>
                  </div>

                  <Button disabled={busy} onClick={submitArt} className="w-full">{busy ? "Saving…" : "Save article"}</Button>
                </aside>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
