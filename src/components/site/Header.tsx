import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoAssetSrc from "@/assets/buruj-logo-full.jpeg";
const logoAsset = { url: logoAssetSrc };
import { Button } from "@/components/ui/button";
import { useTrialSheet } from "./TrialForm";
import { useSiteSettings } from "@/lib/use-site-settings";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/programmes", label: "Programmes" },
  { to: "/players", label: "Squad" },
  { to: "/admissions", label: "Admissions" },
  { to: "/news", label: "News" },
  { to: "/gallery", label: "Media" },
  { to: "/contact", label: "Contact" },
  { to: "/portal", label: "Parents" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { open: openTrial } = useTrialSheet();
  const s = useSiteSettings();
  return (
    <header style={{ backgroundColor: s.header_bg, color: s.header_fg }} className="sticky top-0 z-50 border-b border-current/10 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={logoAsset.url} alt="Buruj Sports Academy" className="h-12 w-auto shrink-0 rounded-md object-contain" />
        </Link>
        <nav className="hidden items-center gap-4 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="font-display text-base font-semibold uppercase tracking-wider opacity-85 transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
          <Button onClick={openTrial} className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">
            Register for trials
          </Button>
        </nav>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-current/10 px-4 pb-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 font-display text-lg font-semibold uppercase">
              {n.label}
            </Link>
          ))}
          <Button onClick={() => { setOpen(false); openTrial(); }} className="mt-2 bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">
            Register for trials
          </Button>
        </nav>
      )}
    </header>
  );
}
