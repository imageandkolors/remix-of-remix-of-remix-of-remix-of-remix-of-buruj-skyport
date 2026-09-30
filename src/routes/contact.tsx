import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading, Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE, waLink } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Campus — Buruj Sports Academy, Ikorodu" },
      { name: "description", content: "Visit Buruj Sports Academy at 8, Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos. Chat on WhatsApp or send an enquiry." },
      { property: "og:title", content: "Contact Buruj Sports Academy" },
      { property: "og:description", content: "Campus address, WhatsApp and enquiry form." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  programme: z.string().optional(),
  message: z.string().trim().min(5, "Add a short message").max(3000),
});

function Contact() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the form"); return; }
    setLoading(true);
    const { error } = await supabase.from("enquiries").insert({ name: parsed.data.name, message: parsed.data.message, phone: parsed.data.phone || null, programme: parsed.data.programme || null, email: parsed.data.email || null });
    setLoading(false);
    if (error) { toast.error("Could not send. Please try again."); return; }
    toast.success("Thanks! Our admissions team will be in touch.");
    form.reset();
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <div>
        <SectionHeading eyebrow="Contact & campus" title="Come and see Buruj" intro="Visit the campus, chat with us on WhatsApp, or send an enquiry — no account needed." />
        <div className="mt-8 space-y-4">
          <div className="flex gap-4 rounded-xl border bg-card p-5"><MapPin className="h-6 w-6 shrink-0 text-primary" /><div><p className="font-display text-lg font-bold uppercase text-navy">Campus</p><p className="text-muted-foreground">{SITE.address}</p></div></div>
          <a href={waLink()} target="_blank" rel="noreferrer" className="glow-hover flex gap-4 rounded-xl border bg-card p-5"><MessageCircle className="h-6 w-6 shrink-0 text-primary" /><div><p className="font-display text-lg font-bold uppercase text-navy">WhatsApp</p><p className="text-muted-foreground">Chat with admissions directly</p></div></a>
          <a href={`mailto:${SITE.email}`} className="glow-hover flex gap-4 rounded-xl border bg-card p-5"><Mail className="h-6 w-6 shrink-0 text-primary" /><div><p className="font-display text-lg font-bold uppercase text-navy">Email</p><p className="text-muted-foreground">{SITE.email}</p></div></a>
        </div>
        <iframe
          title="Buruj campus map"
          className="mt-6 h-64 w-full rounded-xl border"
          loading="lazy"
          src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`}
        />
      </div>
      <Reveal>
        <form onSubmit={onSubmit} className="rounded-xl border-t-4 border-gold bg-card p-8 shadow-xl">
          <h2 className="text-4xl font-extrabold uppercase text-navy">Send an enquiry</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="name">Name *</Label><Input id="name" name="name" required /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="programme">Interested in</Label>
              <select id="programme" name="programme" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>Play & Study</option><option>Football Camping</option><option>Trials</option><option>General</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="message">Message *</Label><Textarea id="message" name="message" rows={5} required /></div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="mt-6 w-full font-display text-base font-bold uppercase">{loading ? "Sending…" : "Send enquiry"}</Button>
        </form>
      </Reveal>
    </section>
  );
}
