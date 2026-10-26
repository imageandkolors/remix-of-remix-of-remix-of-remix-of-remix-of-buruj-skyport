import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Link2, Plus, Save, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  listContentAdmin,
  requestCmsUpload,
  saveNews,
  deleteNews,
  saveSlide,
  deleteSlide,
  saveSocialFeed,
  type NewsItem,
  type SplashSlide,
  type SocialFeed,
} from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/content")({ component: ContentAdminPage });

type ContentData = Awaited<ReturnType<typeof listContentAdmin>>;
type Draft = NewsItem & {
  body_html: string;
  tags: string[];
  seo_keywords: string;
  cover_preview?: string | null;
};
const EMPTY: Draft = {
  id: "",
  slug: "",
  title: "New article",
  excerpt: "",
  body: "",
  body_html: "<p>Start writing your article here…</p>",
  category: "Academy News",
  tags: [],
  seo_keywords: "",
  author: "",
  is_featured: false,
  published: false,
  published_at: new Date().toISOString(),
  cover_path: null,
  cover_url: null,
  cover_preview: null,
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  social_image_path: null,
  social_image_url: null,
  seo_author: "",
  article_section: "",
  schema_publisher: "Buruj Sports Academy",
};

function ContentAdminPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["content-admin"], queryFn: () => listContentAdmin() });
  const [selected, setSelected] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"articles" | "slides" | "feeds">("articles");
  const refresh = () => qc.invalidateQueries({ queryKey: ["content-admin"] });
  useEffect(() => {
    if (!selected && q.data?.news[0]) setSelected(toDraft(q.data.news[0]));
  }, [q.data, selected]);
  const posts = q.data?.news ?? [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Content management
          </p>
          <h1 className="mt-1 text-3xl font-extrabold uppercase text-navy">News, media & feeds</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upload local images and videos to Supabase Storage, format article text, configure SEO,
            control the homepage slider, and connect social feed sources.
          </p>
        </div>
        <Button
          onClick={() => {
            setTab("articles");
            setSelected({ ...EMPTY, slug: `new-article-${Date.now().toString(36)}` });
          }}
        >
          <Plus />
          New article
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-b">
        <Tab active={tab === "articles"} onClick={() => setTab("articles")}>
          Articles
        </Tab>
        <Tab active={tab === "slides"} onClick={() => setTab("slides")}>
          Homepage sliders
        </Tab>
        <Tab active={tab === "feeds"} onClick={() => setTab("feeds")}>
          Social feeds
        </Tab>
      </div>
      {q.isLoading && <p className="py-12 text-muted-foreground">Loading content…</p>}
      {q.error && <p className="py-12 text-destructive">{(q.error as Error).message}</p>}
      {tab === "articles" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelected(toDraft(post))}
                className={`w-full rounded-xl border p-3 text-left ${selected?.id === post.id ? "border-navy bg-navy text-white" : "bg-card hover:border-primary"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="line-clamp-2 text-sm font-semibold">{post.title}</span>
                  <span className="text-[10px] uppercase">{post.published ? "Live" : "Draft"}</span>
                </div>
                <p
                  className={`mt-1 text-xs ${selected?.id === post.id ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {post.category}
                </p>
              </button>
            ))}
            {!posts.length && (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No saved articles yet. Create your first one.
              </div>
            )}
          </aside>
          {selected && (
            <ArticleEditor
              initial={selected}
              categories={q.data?.categories ?? []}
              onSaved={() => {
                setSelected(null);
                refresh();
              }}
              onDeleted={() => {
                setSelected(null);
                refresh();
              }}
            />
          )}
        </div>
      )}
      {tab === "slides" && <SlideManager slides={q.data?.slides ?? []} onRefresh={refresh} />}
      {tab === "feeds" && <FeedManager feeds={q.data?.feeds ?? []} onRefresh={refresh} />}
    </div>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}
function toDraft(n: NewsItem): Draft {
  return {
    ...n,
    body_html:
      n.body_html ??
      (n.body ? `<p>${escapeHtml(n.body).replace(/\n\n/g, "</p><p>")}</p>` : "<p></p>"),
    tags: n.tags ?? [],
    seo_keywords: n.seo_keywords ?? "",
    cover_preview: n.cover_url,
  };
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!,
  );
}

function ArticleEditor({
  initial,
  categories,
  onSaved,
  onDeleted,
}: {
  initial: Draft;
  categories: { name: string }[];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  // Initialize the editor only when switching articles; input updates are handled by syncHtml.
  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== p.body_html)
      editor.current.innerHTML = p.body_html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);
  const set = (key: keyof Draft, value: unknown) => setP((x) => ({ ...x, [key]: value }));
  async function upload(file: File, purpose: "news" | "social" | "splash", inline = false) {
    setBusy(true);
    try {
      const r = await requestCmsUpload({
        data: { filename: file.name, mimeType: file.type, size: file.size, purpose },
      });
      const { error } = await supabase.storage
        .from(r.bucket)
        .uploadToSignedUrl(r.path, r.token, file, { contentType: file.type });
      if (error) throw error;
      const preview = URL.createObjectURL(file);
      if (inline) {
        document.execCommand(
          "insertHTML",
          false,
          file.type.startsWith("video/")
            ? `<video controls data-storage-path="${r.path}" src="${preview}"></video>`
            : `<img alt="" data-storage-path="${r.path}" src="${preview}" />`,
        );
        syncHtml();
      } else setP((x) => ({ ...x, cover_path: r.path, cover_preview: preview }));
      toast.success("Media uploaded to local site storage");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function syncHtml() {
    if (editor.current) set("body_html", editor.current.innerHTML);
  }
  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
    syncHtml();
  }
  async function save(publish?: boolean) {
    setBusy(true);
    try {
      await saveNews({
        data: {
          id: p.id || undefined,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          body: (p.body_html || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 20000),
          body_html: p.body_html,
          category: p.category,
          tags: p.tags,
          seo_keywords: p.seo_keywords,
          author: p.author,
          cover_path: p.cover_path,
          social_image_path: p.social_image_path,
          is_featured: p.is_featured,
          published: publish ?? p.published,
          published_at: p.published_at,
          meta_title: p.meta_title,
          meta_description: p.meta_description,
          canonical_url: p.canonical_url,
          seo_author: p.seo_author,
          article_section: p.article_section,
          schema_publisher: p.schema_publisher,
        },
      });
      toast.success((publish ?? p.published) ? "Article published" : "Draft saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!p.id || !confirm("Delete this article?")) return;
    setBusy(true);
    try {
      await deleteNews({ data: { id: p.id } });
      toast.success("Article deleted");
      onDeleted();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Editorial workspace
          </p>
          <h2 className="mt-1 text-xl font-bold">{p.title || "New article"}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => void save(false)}>
            <Save />
            Save draft
          </Button>
          <Button disabled={busy} onClick={() => void save(true)}>
            Publish
          </Button>
          {p.id && (
            <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Field label="Article title">
          <Input value={p.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Category">
          <Input
            list="cms-categories"
            value={p.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <datalist id="cms-categories">
            {categories.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </datalist>
        </Field>
        <Field label="Slug">
          <Input value={p.slug} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Author">
          <Input value={p.author ?? ""} onChange={(e) => set("author", e.target.value)} />
        </Field>
      </div>
      <div className="mt-5">
        <Field label="Summary / excerpt">
          <Textarea
            rows={3}
            value={p.excerpt ?? ""}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-5 rounded-xl border">
        <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
          <Tool label="H1" onClick={() => format("formatBlock", "<h1>")} />
          <Tool label="H2" onClick={() => format("formatBlock", "<h2>")} />
          <Tool label="B" onClick={() => format("bold")} />
          <Tool label="I" onClick={() => format("italic")} />
          <Tool label="U" onClick={() => format("underline")} />
          <Tool label="• List" onClick={() => format("insertUnorderedList")} />
          <Tool label="1. List" onClick={() => format("insertOrderedList")} />
          <Tool label="Quote" onClick={() => format("formatBlock", "<blockquote>")} />
          <Tool
            label="Link"
            onClick={() => {
              const url = prompt("Paste a safe https:// link");
              if (url?.startsWith("https://")) format("createLink", url);
            }}
          />
          <label className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-background">
            <ImagePlus className="h-3.5 w-3.5" />
            Image/video
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) void upload(f, "news", true);
              }}
            />
          </label>
        </div>
        <div
          ref={editor}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHtml}
          className="prose prose-sm min-h-64 max-w-none p-4 outline-none"
        />{" "}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Field label="Cover image or video (local file only)">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" disabled={busy}>
              <label className="cursor-pointer">
                <Upload />
                {p.cover_path ? "Replace local media" : "Upload local media"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.currentTarget.value = "";
                    if (f) void upload(f, "news");
                  }}
                />
              </label>
            </Button>
            {p.cover_path && (
              <span className="text-xs text-muted-foreground">Stored in site-media</span>
            )}
          </div>
          {p.cover_preview && (
            <img
              src={p.cover_preview}
              alt="Cover preview"
              className="mt-3 h-32 w-full rounded-lg object-cover"
            />
          )}
        </Field>
        <Field label="Tags (comma separated)">
          <Input
            value={p.tags.join(", ")}
            onChange={(e) =>
              set(
                "tags",
                e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
            placeholder="academy, matchday, admissions"
          />
        </Field>
      </div>
      <div className="mt-5 rounded-xl border p-4">
        <h3 className="font-semibold">SEO settings</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="SEO title">
            <Input value={p.meta_title ?? ""} onChange={(e) => set("meta_title", e.target.value)} />
          </Field>
          <Field label="Canonical URL">
            <Input
              value={p.canonical_url ?? ""}
              onChange={(e) => set("canonical_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={3}
              value={p.meta_description ?? ""}
              onChange={(e) => set("meta_description", e.target.value)}
            />
          </Field>
          <Field label="SEO keywords">
            <Textarea
              rows={3}
              value={p.seo_keywords}
              onChange={(e) => set("seo_keywords", e.target.value)}
              placeholder="football academy, Lagos, trials"
            />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
          />
          Featured article
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Published
        </label>
      </div>
    </main>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Tool({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded px-2 py-1 text-xs font-semibold hover:bg-background"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SlideManager({ slides, onRefresh }: { slides: SplashSlide[]; onRefresh: () => void }) {
  const [s, setS] = useState<Partial<SplashSlide> | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!s) return;
    setBusy(true);
    try {
      await saveSlide({
        data: {
          id: s.id,
          sort: Number(s.sort ?? 0),
          kind: (s.kind as "image_text") ?? "image_text",
          media_kind: (s.media_kind as "image" | "video" | "youtube" | "none") ?? "image",
          title: s.title ?? null,
          subtitle: s.subtitle ?? null,
          image_path: s.image_path ?? null,
          video_path: s.video_path ?? null,
          youtube_url: s.youtube_url ?? null,
          alt_text: s.alt_text ?? null,
          link_url: s.link_url ?? null,
          bg_color: s.bg_color ?? "#0b1f3a",
          is_active: s.is_active ?? true,
        },
      });
      toast.success("Slider saved");
      setS(null);
      onRefresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mt-6 space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Homepage sliders</h2>
        <Button
          onClick={() =>
            setS({
              sort: slides.length,
              kind: "image_text",
              media_kind: "image",
              bg_color: "#0b1f3a",
              is_active: true,
            })
          }
        >
          <Plus />
          New slide
        </Button>
      </div>
      {slides.map((x) => (
        <div
          key={x.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
        >
          <div>
            <p className="font-semibold">{x.title || "Untitled slide"}</p>
            <p className="text-xs text-muted-foreground">
              {x.media_kind || "image"} · sort {x.sort} · {x.is_active ? "active" : "hidden"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setS(x)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                if (confirm("Delete slide?")) {
                  await deleteSlide({ data: { id: x.id } });
                  onRefresh();
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      {s && (
        <div className="rounded-xl border bg-card p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Title">
              <Input
                value={s.title ?? ""}
                onChange={(e) => setS({ ...s, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={s.subtitle ?? ""}
                onChange={(e) => setS({ ...s, subtitle: e.target.value })}
              />
            </Field>
            <Field label="Media type">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={s.media_kind ?? "image"}
                onChange={(e) => setS({ ...s, media_kind: e.target.value })}
              >
                <option value="image">Local image</option>
                <option value="video">Local video</option>
                <option value="youtube">YouTube video</option>
                <option value="none">Text only</option>
              </select>
            </Field>
            <Field label="YouTube URL">
              <Input
                value={s.youtube_url ?? ""}
                onChange={(e) => setS({ ...s, youtube_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=…"
              />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                value={s.sort ?? 0}
                onChange={(e) => setS({ ...s, sort: Number(e.target.value) })}
              />
            </Field>
            <Field label="Background">
              <Input
                type="color"
                value={s.bg_color ?? "#0b1f3a"}
                onChange={(e) => setS({ ...s, bg_color: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button disabled={busy} onClick={() => void save()}>
              <Save />
              Save slide
            </Button>
            <Button variant="outline" onClick={() => setS(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function FeedManager({ feeds, onRefresh }: { feeds: SocialFeed[]; onRefresh: () => void }) {
  const [f, setF] = useState<Partial<SocialFeed> | null>(null);
  const save = async () => {
    if (!f?.label || !f.source_url) return;
    try {
      await saveSocialFeed({
        data: {
          id: f.id,
          platform: f.platform ?? "youtube",
          label: f.label,
          source_url: f.source_url,
          is_active: f.is_active ?? true,
          display_limit: Number(f.display_limit ?? 6),
          sort: Number(f.sort ?? 0),
        },
      });
      toast.success("Feed saved");
      setF(null);
      onRefresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <section className="mt-6 space-y-4">
      <div className="flex justify-between">
        <div>
          <h2 className="text-xl font-bold">Social feeds</h2>
          <p className="text-sm text-muted-foreground">
            Add official YouTube, Instagram, or Facebook source links. The public site presents
            these as managed feed cards without scraping or exposing API tokens.
          </p>
        </div>
        <Button
          onClick={() =>
            setF({ platform: "youtube", is_active: true, display_limit: 6, sort: feeds.length })
          }
        >
          <Plus />
          Add feed
        </Button>
      </div>
      {feeds.map((x) => (
        <div
          key={x.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
        >
          <div>
            <p className="font-semibold">{x.label}</p>
            <p className="text-xs text-muted-foreground">
              {x.platform} · {x.source_url}
            </p>
          </div>
          <Button variant="outline" onClick={() => setF(x)}>
            Edit
          </Button>
        </div>
      ))}
      {f && (
        <div className="rounded-xl border bg-card p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Platform">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={f.platform}
                onChange={(e) => setF({ ...f, platform: e.target.value as SocialFeed["platform"] })}
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </Field>
            <Field label="Label">
              <Input
                value={f.label ?? ""}
                onChange={(e) => setF({ ...f, label: e.target.value })}
              />
            </Field>
            <Field label="Official source URL">
              <Input
                value={f.source_url ?? ""}
                onChange={(e) => setF({ ...f, source_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Display limit">
              <Input
                type="number"
                value={f.display_limit ?? 6}
                onChange={(e) => setF({ ...f, display_limit: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void save()}>
              <Save />
              Save feed
            </Button>
            <Button variant="outline" onClick={() => setF(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
