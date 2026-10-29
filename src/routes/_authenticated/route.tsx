import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/squad", label: "Squad Manager", icon: Users },
  { to: "/manage-programmes", label: "Programmes", icon: GraduationCap },
  { to: "/content", label: "Content", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/page-settings", label: "Contact & SEO", icon: SlidersHorizontal },
] as const;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = Route.useRouteContext();

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/dashboard" } });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-navy text-navy-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="font-display text-lg font-extrabold uppercase tracking-wide text-white"
            >
              Buruj Admin
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 lg:hidden"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => {
              const active =
                pathname === to || (to !== "/dashboard" && pathname.startsWith(`${to}/`));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="max-w-52 truncate text-xs text-white/70">{user.email}</span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
