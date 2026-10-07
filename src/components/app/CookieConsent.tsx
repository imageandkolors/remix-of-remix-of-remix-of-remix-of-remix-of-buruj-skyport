import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "bsa-cookie-consent";

/** Cookie + privacy notice. Choice stored on this device. */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!localStorage.getItem(KEY)) setOpen(true); }, []);
  const choose = (v: "all" | "essential") => { localStorage.setItem(KEY, JSON.stringify({ v, at: new Date().toISOString() })); setOpen(false); };
  if (!open) return null;
  return (
    <div role="dialog" aria-label="Cookies and privacy" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-2xl rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl md:bottom-6">
      <div className="flex gap-3">
        <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
        <div className="text-sm">
          <p className="font-semibold">Cookies & your privacy</p>
          <p className="mt-1 text-muted-foreground">
            We use essential cookies to keep you signed in and save application drafts, and optional ones to improve the site.
            We protect children's and families' data under the Nigeria Data Protection Act. Read our{" "}
            <Link to="/privacy-policy" className="font-medium text-primary underline">Privacy Policy</Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose("all")}>Accept all</Button>
            <Button size="sm" variant="outline" onClick={() => choose("essential")}>Essential only</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
