import { useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAboutSection, saveAboutSection, type AboutSection } from "@/lib/about.functions";
import { requestCmsUpload } from "@/lib/content.functions";

function blank(): Partial<AboutSection> {
  return {
    section_key: "new-section",
    sort: 10,
    layout: "content",
    eyebrow: "",
    title: "New section",
    body_html: "<p>Write this section…</p>",
    image_path: null,
    image_alt: "",
    bg_color: "#ffffff",
    text_color: "#0b1f3a",
    accent_color: "#e7b93e",
    is_active: true,
    image_url: null,
  };
}
export function AboutManager({
  sections,
  onRefresh,
}: {
  sections: AboutSection[];
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState<Partial<AboutSection> | null>(null);
  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">About Us sections</h2>
          <p className="text-sm text-muted-foreground">
            Edit every heading, paragraph, image, layout, visibility state, and section colour.
            Images are uploaded from this device.
          </p>
        </div>
        <Button onClick={() => setEditing(blank())}>
          <Plus />
          New section
        </Button>
      </div>
      {editing && (
        <AboutEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
        />
      )}
      {sections.map((section) => (
        <div
          key={section.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
        >
          <div>
            <p className="font-semibold">{section.title}</p>
            <p className="text-xs text-muted-foreground">
              {section.section_key} · {section.layout} · order {section.sort} ·{" "}
              {section.is_active ? "published" : "hidden"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(section)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                if (confirm(`Delete ${section.title}?`)) {
                  await deleteAboutSection({ data: { id: section.id } });
                  toast.success("Section deleted");
                  onRefresh();
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
function AboutEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<AboutSection>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor.current) editor.current.innerHTML = s.body_html || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id]);
  const set = (key: keyof AboutSection, value: unknown) => setS((x) => ({ ...x, [key]: value }));
  function sync() {
    if (editor.current) set("body_html", editor.current.innerHTML);
  }
  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }
  async function upload(file: File) {
    setBusy(true);
    try {
      const r = await requestCmsUpload({
        data: { filename: file.name, mimeType: file.type, size: file.size, purpose: "about" },
      });
      const { error } = await supabase.storage
        .from(r.bucket)
        .uploadToSignedUrl(r.path, r.token, file, { contentType: file.type });
      if (error) throw error;
      setS((x) => ({ ...x, image_path: r.path, image_url: URL.createObjectURL(file) }));
      toast.success("About image uploaded locally");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    try {
      await saveAboutSection({
        data: {
          id: s.id,
          section_key: s.section_key || "new-section",
          sort: Number(s.sort ?? 0),
          layout: (s.layout || "content") as AboutSection["layout"],
          eyebrow: s.eyebrow || null,
          title: s.title || "Untitled section",
          body_html: s.body_html || "",
          image_path: s.image_path || null,
          image_alt: s.image_alt || null,
          bg_color: s.bg_color || "#ffffff",
          text_color: s.text_color || "#0b1f3a",
          accent_color: s.accent_color || "#e7b93e",
          is_active: s.is_active ?? true,
        },
      });
      toast.success("About section saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Section key">
          <Input
            value={s.section_key ?? ""}
            onChange={(e) =>
              set("section_key", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))
            }
          />
        </Field>
        <Field label="Layout">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={s.layout ?? "content"}
            onChange={(e) => set("layout", e.target.value)}
          >
            <option value="hero">Hero</option>
            <option value="content">Content</option>
            <option value="split">Text + image</option>
            <option value="cards">Cards/content</option>
            <option value="cta">Call to action</option>
          </select>
        </Field>
        <Field label="Eyebrow">
          <Input value={s.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} />
        </Field>
        <Field label="Display order">
          <Input
            type="number"
            value={s.sort ?? 0}
            onChange={(e) => set("sort", Number(e.target.value))}
          />
        </Field>
        <div className="lg:col-span-2">
          <Field label="Section title">
            <Input value={s.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-4 rounded-xl border">
        <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
          <Tool label="H1" onClick={() => format("formatBlock", "<h1>")} />
          <Tool label="H2" onClick={() => format("formatBlock", "<h2>")} />
          <Tool label="B" onClick={() => format("bold")} />
          <Tool label="I" onClick={() => format("italic")} />
          <Tool label="List" onClick={() => format("insertUnorderedList")} />
          <Tool label="Quote" onClick={() => format("formatBlock", "<blockquote>")} />
        </div>
        <div
          ref={editor}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          className="prose min-h-48 max-w-none p-4 outline-none"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Field label="Background colour">
          <Input
            type="color"
            value={s.bg_color ?? "#ffffff"}
            onChange={(e) => set("bg_color", e.target.value)}
          />
        </Field>
        <Field label="Text colour">
          <Input
            type="color"
            value={s.text_color ?? "#0b1f3a"}
            onChange={(e) => set("text_color", e.target.value)}
          />
        </Field>
        <Field label="Accent colour">
          <Input
            type="color"
            value={s.accent_color ?? "#e7b93e"}
            onChange={(e) => set("accent_color", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-4">
        <Label>Local section image</Label>
        <div className="mt-2 flex items-center gap-3">
          <Button asChild variant="outline" disabled={busy}>
            <label className="cursor-pointer">
              <Upload />
              {s.image_path ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (file) void upload(file);
                }}
              />
            </label>
          </Button>
          {s.image_path && (
            <span className="text-xs text-muted-foreground">Stored in site-media/about</span>
          )}
        </div>
        {s.image_url && (
          <img
            src={s.image_url}
            alt="Preview"
            className="mt-3 h-36 w-full rounded-lg object-cover"
          />
        )}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="Image alt text">
          <Input value={s.image_alt ?? ""} onChange={(e) => set("image_alt", e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={s.is_active ?? true}
            onChange={(e) => set("is_active", e.target.checked)}
          />
          Published on About page
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <Button disabled={busy} onClick={() => void save()}>
          <Save />
          Save section
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
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
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded px-2 py-1 text-xs font-semibold hover:bg-background"
    >
      {label}
    </button>
  );
}
