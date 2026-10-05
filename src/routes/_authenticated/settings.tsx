import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SETTINGS, type SiteSettings, getSiteSettings, saveSiteSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [
    { title: "Site Settings — Buruj Sports Academy" },
    { name: "description", content: "Admin settings for academy contact details, social links and header/footer colours." },
    { property: "og:title", content: "Site Settings — Buruj Sports Academy" },
    { property: "og:description", content: "Admin site settings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Settings,
});

type Form = Record<keyof SiteSettings, string>;

function Settings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const [f, setF] = useState<Form>(() => toForm(DEFAULT_SETTINGS));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (q.data) setF(toForm(q.data)); }, [q.data]);
  const set = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setSaving(true);
    try {
      await saveSiteSettings({ data: f });
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved — live across the site");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg.includes("[") ? "Check the highlighted values" : msg || "Could not save");
    } finally { setSaving(false); }
  }

  const text = (k: keyof SiteSettings, label: string, ph = "") => <div className="space-y-1.5"><Label htmlFor={k}>{label}</Label><Input id={k} value={f[k]} placeholder={ph} onChange={set(k)} /></div>;
  const color = (k: keyof SiteSettings, label: string) => (
    <div className="space-y-1.5"><Label htmlFor={k}>{label}</Label>
      <div className="flex items-center gap-2"><input id={k} type="color" value={f[k]} onChange={set(k)} className="h-10 w-14 cursor-pointer rounded border bg-background" /><Input value={f[k]} onChange={set(k)} className="font-mono" maxLength={7} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Dashboard</Link></Button>
        <h1 className="mt-3 text-4xl font-extrabold uppercase text-navy">Site settings</h1>
        <p className="text-muted-foreground">Changes appear on the public site immediately. Admins only.</p>

        <section className="mt-6 grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2">
          <h2 className="font-display text-xl font-bold uppercase text-primary sm:col-span-2">Contact</h2>
          {text("whatsapp", "WhatsApp number (with country code)", "2348012345678")}
          {text("email", "Admissions email")}
          {text("phone", "Campus phone (optional)")}
        </section>

        <section className="mt-6 grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2">
          <h2 className="font-display text-xl font-bold uppercase text-primary sm:col-span-2">Social links</h2>
          {text("facebook", "Facebook page", "https://facebook.com/…")}
          {text("instagram", "Instagram", "https://instagram.com/…")}
          {text("tiktok", "TikTok", "https://tiktok.com/@…")}
          {text("x_url", "X (Twitter)", "https://x.com/…")}
          {text("youtube", "YouTube", "https://youtube.com/@…")}
        </section>

        <section className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="font-display text-xl font-bold uppercase text-primary">Header & footer colours</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {color("header_bg", "Header background")}{color("header_fg", "Header text")}
            {color("footer_bg", "Footer background")}{color("footer_fg", "Footer text")}
          </div>
          <div className="mt-5 overflow-hidden rounded-md border text-sm">
            <div style={{ backgroundColor: f.header_bg, color: f.header_fg }} className="px-4 py-3 font-display font-bold uppercase">Header preview · Home · About · Squad</div>
            <div className="bg-background px-4 py-6 text-muted-foreground">Page content</div>
            <div style={{ backgroundColor: f.footer_bg, color: f.footer_fg }} className="px-4 py-3">Footer preview · © Buruj Sports Academy</div>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setF({ ...f, header_bg: DEFAULT_SETTINGS.header_bg, header_fg: DEFAULT_SETTINGS.header_fg, footer_bg: DEFAULT_SETTINGS.footer_bg, footer_fg: DEFAULT_SETTINGS.footer_fg })}>Reset brand colours</Button>
        </section>

        <div className="mt-6 flex justify-end"><Button onClick={save} disabled={saving} className="font-display font-bold uppercase">{saving ? "Saving…" : "Save settings"}</Button></div>
      </div>
    </div>
  );
}

function toForm(s: SiteSettings): Form {
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ""])) as Form;
}
