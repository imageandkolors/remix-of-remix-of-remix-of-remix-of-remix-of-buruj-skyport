import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import logoAssetSrc from "@/assets/buruj-logo-full.jpeg";
const logoAsset = { url: logoAssetSrc };
import { Button } from "@/components/ui/button";
import { useTrialSheet } from "./TrialForm";
import { useSiteSettings } from "@/lib/use-site-settings";
import { supabase } from "@/integrations/supabase/client";

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
  const [session, setSession] = useState<boolean>(false);
  const { open: openTrial } = useTrialSheet();
  const s = useSiteSettings();
  const navigate = useNavigate();
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(Boolean(next)),
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  async function signOut() {
    await supabase.auth.signOut();
    setSession(false);
    setOpen(false);
    await navigate({ to: "/" });
  }
  return (
    <header
      style={{ backgroundColor: s.header_bg, color: s.header_fg }}
      className="sticky top-0 z-50 border-b border-current/10 backdrop-blur"
    >
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logoAsset.url}
            alt="Buruj Sports Academy"
            className="h-12 w-auto shrink-0 rounded-md object-contain sm:h-14"
          />
        </Link>
        <nav className="hidden items-center gap-3 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="font-display text-sm font-semibold uppercase tracking-wider opacity-85 transition-colors hover:text-gold xl:text-base"
              activeProps={{ className: "text-gold" }}
            >
              {n.label}
            </Link>
          ))}
          <Button
            onClick={openTrial}
            className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"
          >
            Register
          </Button>
          {session ? (
            <>
              <Button asChild variant="ghost" className="text-current hover:bg-white/10">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => void signOut()}
                className="border-current/30 text-current hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="text-current hover:bg-white/10">
              <Link to="/auth" search={{ redirect: "/dashboard" }}>
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>
        <button
          className="rounded-md p-2 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex max-h-[calc(100vh-72px)] flex-col gap-1 overflow-y-auto border-t border-current/10 px-4 pb-4 lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="py-2 font-display text-lg font-semibold uppercase"
            >
              {n.label}
            </Link>
          ))}
          <Button
            onClick={() => {
              setOpen(false);
              openTrial();
            }}
            className="mt-2 bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"
          >
            Register for trials
          </Button>
          {session ? (
            <>
              <Button
                asChild
                variant="outline"
                className="mt-2 justify-start border-current/30 text-current"
              >
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => void signOut()}
                className="justify-start border-current/30 text-current"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="mt-2 justify-start border-current/30 text-current"
            >
              <Link to="/auth" search={{ redirect: "/dashboard" }} onClick={() => setOpen(false)}>
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
