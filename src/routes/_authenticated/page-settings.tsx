import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, MapPin, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestCmsUpload } from "@/lib/content.functions";
import {
  deleteContactLocation,
  listContactAdmin,
  listPageSeoAdmin,
  saveContactLocation,
  saveContactPage,
  savePageSeo,
  type ContactLocation,
  type PageSeo,
} from "@/lib/page-settings.functions";

export const Route = createFileRoute("/_authenticated/page-settings")({
  head: () => ({ meta: [{ title: "Contact & SEO Settings — Buruj Sports Academy" }] }),
  component: PageSettings,
});
const emptyOffice = (): Partial<ContactLocation> => ({
  name: "",
  address: "",
  phone: "",
  email: "",
  whatsapp: "",
  map_url: "",
  sort: 0,
  is_active: true,
});
function PageSettings() {
  const [tab, setTab] = useState<"contact" | "seo">("contact");
  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <h1 className="mt-3 text-4xl font-extrabold uppercase text-navy">Contact & SEO</h1>
        <p className="text-muted-foreground">
          Manage contact information, office locations and social sharing metadata.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 border-b">
          <Button
            variant={tab === "contact" ? "default" : "ghost"}
            onClick={() => setTab("contact")}
          >
            Contact page
          </Button>
          <Button variant={tab === "seo" ? "default" : "ghost"} onClick={() => setTab("seo")}>
            SEO & Open Graph
          </Button>
        </div>
        {tab === "contact" ? <ContactManager /> : <SeoManager />}
      </div>
    </div>
  );
}
function ContactManager() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["contact-admin"], queryFn: () => listContactAdmin() });
  const [heading, setHeading] = useState("");
  const [intro, setIntro] = useState("");
  const [office, setOffice] = useState<Partial<ContactLocation> | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (q.data) {
      setHeading(q.data.heading);
      setIntro(q.data.intro);
    }
  }, [q.data]);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["contact-admin"] });
  async function saveCopy() {
    setSaving(true);
    try {
      await saveContactPage({ data: { heading, intro } });
      toast.success("Contact copy saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this office location?")) return;
    try {
      await deleteContactLocation({ data: { id } });
      toast.success("Office deleted");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <div className="space-y-6">
      {q.isLoading && <p className="py-8 text-muted-foreground">Loading contact settings…</p>}
      <section className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-bold">Contact page copy</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Page heading">
            <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
          </Field>
          <Field label="Introduction">
            <Textarea rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
          </Field>
        </div>
        <Button className="mt-4" disabled={saving} onClick={() => void saveCopy()}>
          <Save />
          Save copy
        </Button>
      </section>
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Office locations</h2>
            <p className="text-sm text-muted-foreground">
              Add campuses, regional offices or admissions locations.
            </p>
          </div>
          <Button onClick={() => setOffice(emptyOffice())}>Add office</Button>
        </div>
        {office && (
          <OfficeEditor
            initial={office}
            onClose={() => setOffice(null)}
            onSaved={() => {
              setOffice(null);
              refresh();
            }}
          />
        )}
        {
          <div className="mt-5 grid gap-3">
            {(q.data?.locations ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-semibold">
                    <MapPin className="mr-1 inline h-4 w-4 text-primary" />
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.address} · order {item.sort} · {item.is_active ? "published" : "hidden"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOffice(item)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => void remove(item.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        }
      </section>
    </div>
  );
}
function OfficeEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<ContactLocation>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [o, setO] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof ContactLocation) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setO({ ...o, [key]: e.target.value });
  async function save() {
    setBusy(true);
    try {
      await saveContactLocation({
        data: {
          id: o.id,
          name: o.name || "",
          address: o.address || "",
          phone: o.phone || null,
          email: o.email || null,
          whatsapp: o.whatsapp || null,
          map_url: o.map_url || null,
          sort: Number(o.sort ?? 0),
          is_active: o.is_active ?? true,
        },
      });
      toast.success("Office saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Office name">
          <Input value={o.name ?? ""} onChange={set("name")} />
        </Field>
        <Field label="Address">
          <Input value={o.address ?? ""} onChange={set("address")} />
        </Field>
        <Field label="Phone">
          <Input value={o.phone ?? ""} onChange={set("phone")} />
        </Field>
        <Field label="Email">
          <Input type="email" value={o.email ?? ""} onChange={set("email")} />
        </Field>
        <Field label="WhatsApp">
          <Input value={o.whatsapp ?? ""} onChange={set("whatsapp")} />
        </Field>
        <Field label="Map URL">
          <Input type="url" value={o.map_url ?? ""} onChange={set("map_url")} />
        </Field>
        <Field label="Display order">
          <Input type="number" value={o.sort ?? 0} onChange={set("sort")} />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={o.is_active ?? true}
            onChange={(e) => setO({ ...o, is_active: e.target.checked })}
          />
          Published
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={busy} onClick={() => void save()}>
          <Save />
          Save office
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
function SeoManager() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["page-seo-admin"], queryFn: () => listPageSeoAdmin() });
  const [selected, setSelected] = useState<PageSeo | null>(null);
  useEffect(() => {
    if (!selected && q.data?.[0]) setSelected(q.data[0]);
  }, [q.data, selected]);
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="space-y-2">
        {q.data?.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelected(page)}
            className={`w-full rounded-lg border p-3 text-left ${selected?.id === page.id ? "border-navy bg-navy text-white" : "bg-card"}`}
          >
            <span className="font-semibold">{page.page_key}</span>
            <span className="block text-xs opacity-70">{page.page_path}</span>
          </button>
        ))}
      </aside>
      {selected ? (
        <SeoEditor
          key={selected.id}
          initial={selected}
          onSaved={() => void qc.invalidateQueries({ queryKey: ["page-seo-admin"] })}
        />
      ) : (
        <p className="text-muted-foreground">No page metadata found.</p>
      )}
    </section>
  );
}
function SeoEditor({ initial, onSaved }: { initial: PageSeo; onSaved: () => void }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set =
    (key: keyof PageSeo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setS({ ...s, [key]: e.target.value });
  async function upload(file: File) {
    setBusy(true);
    try {
      const r = await requestCmsUpload({
        data: { filename: file.name, mimeType: file.type, size: file.size, purpose: "social" },
      });
      const { error } = await supabase.storage
        .from(r.bucket)
        .uploadToSignedUrl(r.path, r.token, file, { contentType: file.type });
      if (error) throw error;
      setS({ ...s, og_image_path: r.path, og_image_url: URL.createObjectURL(file) });
      toast.success("Social image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    try {
      await savePageSeo({
        data: {
          id: s.id,
          title: s.title,
          description: s.description,
          keywords: s.keywords,
          canonical_url: s.canonical_url,
          og_title: s.og_title,
          og_description: s.og_description,
          og_image_path: s.og_image_path,
          og_type: s.og_type as "website" | "article" | "profile",
          twitter_card: s.twitter_card as "summary" | "summary_large_image",
          robots: s.robots,
        },
      });
      toast.success("SEO metadata saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm uppercase tracking-widest text-primary">
            {s.page_key}
          </p>
          <h2 className="text-2xl font-bold">{s.page_path}</h2>
        </div>
        <div className="rounded border p-2 text-xs text-muted-foreground">
          Google/social preview updates after deployment
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        <Field label="SEO title">
          <Input value={s.title} onChange={set("title")} maxLength={200} />
        </Field>
        <Field label="Meta description">
          <Textarea rows={3} value={s.description} onChange={set("description")} maxLength={300} />
        </Field>
        <Field label="Keywords">
          <Input
            value={s.keywords ?? ""}
            onChange={set("keywords")}
            placeholder="football academy, Lagos"
          />
        </Field>
        <Field label="Canonical URL">
          <Input
            type="url"
            value={s.canonical_url ?? ""}
            onChange={set("canonical_url")}
            placeholder="https://…"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Open Graph title">
            <Input value={s.og_title ?? ""} onChange={set("og_title")} />
          </Field>
          <Field label="Open Graph type">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={s.og_type}
              onChange={set("og_type")}
            >
              <option value="website">Website</option>
              <option value="article">Article</option>
              <option value="profile">Profile</option>
            </select>
          </Field>
        </div>
        <Field label="Open Graph description">
          <Textarea rows={3} value={s.og_description ?? ""} onChange={set("og_description")} />
        </Field>
        <div>
          <Label>Open Graph image (local upload)</Label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" disabled={busy}>
              <label className="cursor-pointer">
                <ImagePlus />
                {s.og_image_path ? "Replace image" : "Upload image"}
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
            {s.og_image_path && (
              <span className="text-xs text-muted-foreground">Stored in site-media/social</span>
            )}
          </div>
          {s.og_image_url && (
            <img
              src={s.og_image_url}
              alt="Open Graph preview"
              className="mt-3 aspect-[1.91/1] max-h-48 rounded border object-cover"
            />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Twitter card">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={s.twitter_card}
              onChange={set("twitter_card")}
            >
              <option value="summary_large_image">Summary with large image</option>
              <option value="summary">Summary</option>
            </select>
          </Field>
          <Field label="Robots">
            <Input value={s.robots} onChange={set("robots")} />
          </Field>
        </div>
      </div>
      <Button className="mt-6" disabled={busy} onClick={() => void save()}>
        <Save />
        Save metadata
      </Button>
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
