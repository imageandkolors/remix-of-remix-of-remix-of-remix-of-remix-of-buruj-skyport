import { Link, useRouterState } from "@tanstack/react-router";
import { Home, GraduationCap, Users, FilePen, UserRound } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/admissions", label: "Programmes", icon: GraduationCap },
  { to: "/players", label: "Squad", icon: Users },
  { to: "/apply", label: "Apply", icon: FilePen },
  { to: "/portal", label: "Parents", icon: UserRound },
] as const;

/** App-style bottom navigation, phones only. */
export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-foreground/10 bg-navy/95 text-navy-foreground backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = "exact" in t ? path === t.to : path.startsWith(t.to) || (t.to === "/admissions" && path.startsWith("/programmes"));
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors active:scale-95 ${active ? "text-gold" : "text-navy-foreground/70"}`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_var(--gold)]" : ""}`} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
