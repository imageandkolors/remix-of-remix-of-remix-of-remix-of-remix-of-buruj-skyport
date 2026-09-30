import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Crest } from "./Crest";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/admissions", label: "Admissions" },
  { to: "/gallery", label: "Media" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-navy-foreground/10 bg-navy/95 text-navy-foreground backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Crest className="h-10 w-9 shrink-0" />
          <span className="truncate font-display text-xl font-extrabold uppercase tracking-wide">
            Buruj <span className="text-gold">Sports Academy</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="font-display text-base font-semibold uppercase tracking-wider text-navy-foreground/80 transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90">
            <Link to="/admissions" hash="trial">Register for trials</Link>
          </Button>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-navy-foreground/10 px-4 pb-4 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 font-display text-lg font-semibold uppercase">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
