import { useState } from "react";
import { Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteGalleryMedia,
  requestCmsUpload,
  saveGalleryMedia,
  type GalleryMedia,
} from "@/lib/content.functions";

type Draft = {
  id?: string;
  title: string;
  caption: string;
  category: string;
  kind: "image" | "video" | "youtube";
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  sort: number;
  is_active: boolean;
  preview?: string | null;
};
const blank = (): Draft => ({
  title: "",
  caption: "",
  category: "Academy",
  kind: "image",
  storage_path: null,
  external_url: null,
  mime_type: null,
  sort: 0,
  is_active: true,
  preview: null,
});

export function MediaLibrary({
  items,
  onRefresh,
}: {
  items: GalleryMedia[];
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const edit = (item: GalleryMedia) =>
    setDraft({
      id: item.id,
      title: item.title,
      caption: item.caption ?? "",
      category: item.category,
      kind: item.kind,
      storage_path: item.storage_path,
      external_url: item.external_url,
      mime_type: item.mime_type,
      sort: item.sort,
      is_active: item.is_active,
      preview: item.media_url,
    });
  async function upload(file: File) {
    if (!draft) return;
    setBusy(true);
    try {
      const r = await requestCmsUpload({
        data: { filename: file.name, mimeType: file.type, size: file.size, purpose: "social" },
      });
      const { error } = await supabase.storage
        .from(r.bucket)
        .uploadToSignedUrl(r.path, r.token, file, { contentType: file.type });
      if (error) throw error;
      setDraft({
        ...draft,
        kind: file.type.startsWith("video/") ? "video" : "image",
        storage_path: r.path,
        external_url: null,
        mime_type: file.type,
        preview: URL.createObjectURL(file),
      });
      toast.success("Local media uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      await saveGalleryMedia({
        data: {
          id: draft.id,
          title: draft.title,
          caption: draft.caption || null,
          category: draft.category,
          kind: draft.kind,
          storage_path: draft.storage_path,
          external_url: draft.external_url || null,
          mime_type: draft.mime_type,
          sort: Number(draft.sort),
          is_active: draft.is_active,
        },
      });
      toast.success("Media saved");
      setDraft(null);
      onRefresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: GalleryMedia) {
    if (!confirm(`Delete ${item.title}?`)) return;
    try {
      await deleteGalleryMedia({ data: { id: item.id } });
      toast.success("Media deleted");
      onRefresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <section className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Media library</h2>
          <p className="text-sm text-muted-foreground">
            Images and videos are uploaded from this device into Supabase Storage. YouTube is the
            only external video source allowed.
          </p>
        </div>
        <Button onClick={() => setDraft(blank())}>
          <Plus />
          Add media
        </Button>
      </div>
      {draft && (
        <div className="rounded-xl border bg-card p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                className="mt-1"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Media type</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as Draft["kind"],
                    storage_path: e.target.value === "youtube" ? null : draft.storage_path,
                    external_url: e.target.value === "youtube" ? draft.external_url : null,
                  })
                }
              >
                <option value="image">Local image</option>
                <option value="video">Local video</option>
                <option value="youtube">YouTube video</option>
              </select>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                className="mt-1"
                type="number"
                value={draft.sort}
                onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
              />
            </div>
            {draft.kind === "youtube" ? (
              <div className="lg:col-span-2">
                <Label>YouTube URL</Label>
                <Input
                  className="mt-1"
                  value={draft.external_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, external_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </div>
            ) : (
              <div className="lg:col-span-2">
                <Button asChild variant="outline" disabled={busy}>
                  <label className="cursor-pointer">
                    <Upload />
                    {draft.storage_path ? "Replace local file" : "Upload local file"}
                    <input
                      type="file"
                      accept={draft.kind === "video" ? "video/*" : "image/*"}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = "";
                        if (file) void upload(file);
                      }}
                    />
                  </label>
                </Button>
                {draft.storage_path && (
                  <span className="ml-3 text-xs text-muted-foreground">
                    Stored locally in site-media
                  </span>
                )}
              </div>
            )}
            <div className="lg:col-span-2">
              <Label>Caption</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={draft.caption}
                onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button disabled={busy} onClick={() => void save()}>
              <Save />
              Save media
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-video bg-navy">
              {item.kind === "image" && item.media_url && (
                <img src={item.media_url} alt={item.title} className="h-full w-full object-cover" />
              )}
              {item.kind === "video" && item.media_url && (
                <video src={item.media_url} controls className="h-full w-full object-cover" />
              )}
              {item.kind === "youtube" && (
                <div className="grid h-full place-items-center text-gold">YouTube video</div>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.category} · {item.kind} · {item.is_active ? "Published" : "Hidden"}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(item)}>
                  <Pencil />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(item)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!items.length && !draft && (
        <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
          No managed media yet. Add local images, local videos, or YouTube entries.
        </div>
      )}
    </section>
  );
}
