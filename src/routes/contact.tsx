import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading, Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/lib/site";
import { useSiteSettings, waLinkFor } from "@/lib/use-site-settings";
import { getContactPage } from "@/lib/page-settings.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Campus — Buruj Sports Academy, Ikorodu" },
      {
        name: "description",
        content: "Visit Buruj Sports Academy, chat on WhatsApp or send an enquiry.",
      },
      { property: "og:title", content: "Contact Buruj Sports Academy" },
      { property: "og:description", content: "Campus address, WhatsApp and enquiry form." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["contact-page"],
      queryFn: () => getContactPage(),
    }),
  errorComponent: () => (
    <p className="p-10 text-center">We couldn&apos;t load contact details. Please refresh.</p>
  ),
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
  const s = useSiteSettings();
  const { data } = useSuspenseQuery({
    queryKey: ["contact-page"],
    queryFn: () => getContactPage(),
  });
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("enquiries").insert({
      name: parsed.data.name,
      message: parsed.data.message,
      phone: parsed.data.phone || null,
      programme: parsed.data.programme || null,
      email: parsed.data.email || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send. Please try again.");
      return;
    }
    toast.success("Thanks! Our admissions team will be in touch.");
    form.reset();
  }
  const locations = data.locations.length
    ? data.locations
    : [
        {
          id: "default",
          name: "Buruj Sports Academy Campus",
          address: SITE.address,
          phone: null,
          email: s.email,
          whatsapp: s.whatsapp,
          map_url: null,
          sort: 1,
          is_active: true,
        },
      ];
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div>
        <SectionHeading eyebrow="Contact & campus" title={data.heading} intro={data.intro} />
        <div className="mt-8 space-y-4">
          {locations.map((location) => (
            <div key={location.id} className="rounded-xl border bg-card p-5">
              <div className="flex gap-4">
                <MapPin className="h-6 w-6 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold uppercase text-navy">
                    {location.name}
                  </p>
                  <p className="text-muted-foreground">{location.address}</p>
                  {location.phone && (
                    <a
                      className="mt-2 flex items-center gap-2 text-sm hover:text-primary"
                      href={`tel:${location.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                      {location.phone}
                    </a>
                  )}
                  {location.email && (
                    <a
                      className="mt-1 flex items-center gap-2 text-sm hover:text-primary"
                      href={`mailto:${location.email}`}
                    >
                      <Mail className="h-4 w-4" />
                      {location.email}
                    </a>
                  )}
                </div>
              </div>
              {(location.whatsapp || s.whatsapp) && (
                <a
                  href={waLinkFor(location.whatsapp || s.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              )}
              {(location.map_url || location.address) && (
                <iframe
                  title={`${location.name} map`}
                  className="mt-4 h-52 w-full rounded-lg border"
                  loading="lazy"
                  src={
                    location.map_url ||
                    `https://www.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <Reveal>
        <form
          onSubmit={onSubmit}
          className="rounded-xl border-t-4 border-gold bg-card p-6 shadow-xl sm:p-8"
        >
          <h2 className="text-3xl font-extrabold uppercase text-navy sm:text-4xl">
            Send an enquiry
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programme">Interested in</Label>
              <select
                id="programme"
                name="programme"
                required
                defaultValue=""
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option>Football & Education</option>
                <option>Football Development</option>
                <option>Football Camping</option>
                <option>Trials</option>
                <option>General</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" name="message" rows={5} required />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="mt-6 w-full font-display text-base font-bold uppercase"
          >
            {loading ? "Sending…" : "Send enquiry"}
          </Button>
        </form>
      </Reveal>
    </section>
  );
}
