import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BarChart3, ClipboardList, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Applicant = {
  id: string;
  status: string | null;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  programme: string | null;
  school: string | null;
  email: string | null;
};

type DashboardStats = {
  total: number;
  accepted: number;
  pending: number;
  declined: number;
};

type DashboardData = {
  stats: DashboardStats;
  recent: Applicant[];
};

const DEFAULT_DATA: DashboardData = {
  stats: { total: 0, accepted: 0, pending: 0, declined: 0 },
  recent: [],
};

function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const { data: rows, error: dbError } = await supabase
        .from("applicants")
        .select("id, status, created_at, first_name, last_name, programme, school, email")
        .order("created_at", { ascending: false })
        .limit(12);

      if (dbError) throw dbError;

      const recent = (rows ?? []) as Applicant[];
      const stats: DashboardStats = recent.reduce(
        (acc, row) => {
          acc.total += 1;
          const status = (row.status ?? "pending").toLowerCase();
          if (status === "accepted") acc.accepted += 1;
          if (status === "declined") acc.declined += 1;
          if (status === "pending") acc.pending += 1;
          return acc;
        },
        { total: 0, accepted: 0, pending: 0, declined: 0 },
      );

      return { stats, recent };
    },
  });

  const dashboard = data ?? DEFAULT_DATA;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Live intake data
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error.message || "Unable to load the dashboard."}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ClipboardList} label="Total applicants" value={dashboard.stats.total} accent="text-blue-500" />
          <Metric icon={TrendingUp} label="Accepted" value={dashboard.stats.accepted} accent="text-emerald-500" />
          <Metric icon={BarChart3} label="Pending review" value={dashboard.stats.pending} accent="text-amber-500" />
          <Metric icon={ArrowUpRight} label="Declined" value={dashboard.stats.declined} accent="text-rose-500" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent activity</p>
                <h2 className="text-lg font-semibold">Latest applications</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="border-b border-border px-3 py-3 font-medium">Applicant</th>
                    <th className="border-b border-border px-3 py-3 font-medium">Programme</th>
                    <th className="border-b border-border px-3 py-3 font-medium">School</th>
                    <th className="border-b border-border px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        Loading dashboard…
                      </td>
                    </tr>
                  ) : dashboard.recent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        No records found yet.
                      </td>
                    </tr>
                  ) : (
                    dashboard.recent.map((applicant) => {
                      const fullName = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || "Unknown applicant";
                      const status = (applicant.status ?? "pending").toLowerCase();

                      return (
                        <tr key={applicant.id} className="align-top">
                          <td className="border-b border-border px-3 py-3">
                            <div className="font-medium text-foreground">{fullName}</div>
                            <div className="text-xs text-muted-foreground">{applicant.email || "No email"}</div>
                          </td>
                          <td className="border-b border-border px-3 py-3 text-foreground">{applicant.programme || "—"}</td>
                          <td className="border-b border-border px-3 py-3 text-foreground">{applicant.school || "—"}</td>
                          <td className="border-b border-border px-3 py-3">
                            <StatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-muted-foreground">Quick summary</p>
            <h2 className="mt-1 text-lg font-semibold">Operational snapshot</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversion</p>
                <p className="mt-2 text-2xl font-bold">
                  {dashboard.stats.total > 0
                    ? `${Math.max(0, Math.round((dashboard.stats.accepted / dashboard.stats.total) * 100))}%`
                    : "0%"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Action needed</p>
                <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {dashboard.stats.pending} applications waiting
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest update</p>
                <p className="mt-2 text-sm text-foreground">
                  {dashboard.recent[0]?.created_at
                    ? new Date(dashboard.recent[0].created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No recent activity"}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-xl bg-muted p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const palette =
    status === "declined"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      : status === "accepted"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${palette}`}>
      {status}
    </span>
  );
}

