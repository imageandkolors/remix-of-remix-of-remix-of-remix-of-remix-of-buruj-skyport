import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Mail,
  Phone,
  TrendingUp,
} from "lucide-react";
import { getStaffDashboard } from "@/lib/staff.functions";
import { listIntake, updateIntakeStatus } from "@/lib/intake.functions";
import { NotificationManager } from "@/components/staff/NotificationManager";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Applicant = {
  id: string;
  status: string | null;
  created_at: string | null;
  player_name: string | null;
  programme: string | null;
  current_school: string | null;
  guardian_email: string | null;
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
    queryFn: async (): Promise<DashboardData> => getStaffDashboard(),
  });

  const dashboard = data ?? DEFAULT_DATA;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Overview
            </p>
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
          <Metric
            icon={ClipboardList}
            label="Total applicants"
            value={dashboard.stats.total}
            accent="text-blue-500"
          />
          <Metric
            icon={TrendingUp}
            label="Accepted"
            value={dashboard.stats.accepted}
            accent="text-emerald-500"
          />
          <Metric
            icon={BarChart3}
            label="Pending review"
            value={dashboard.stats.pending}
            accent="text-amber-500"
          />
          <Metric
            icon={ArrowUpRight}
            label="Declined"
            value={dashboard.stats.declined}
            accent="text-rose-500"
          />
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
                      const fullName = applicant.player_name || "Unknown applicant";
                      const status = (applicant.status ?? "pending").toLowerCase();

                      return (
                        <tr key={applicant.id} className="align-top">
                          <td className="border-b border-border px-3 py-3">
                            <div className="font-medium text-foreground">{fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {applicant.guardian_email || "No email"}
                            </div>
                          </td>
                          <td className="border-b border-border px-3 py-3 text-foreground">
                            {applicant.programme || "—"}
                          </td>
                          <td className="border-b border-border px-3 py-3 text-foreground">
                            {applicant.current_school || "—"}
                          </td>
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
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Action needed
                </p>
                <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {dashboard.stats.pending} applications waiting
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Latest update
                </p>
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
        <NotificationManager />
        <IntakeInbox />
      </div>
    </div>
  );
}

function IntakeInbox() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["public-intake"], queryFn: () => listIntake() });
  const data = q.data ?? { enquiries: [], trials: [] };

  async function setStatus(type: "enquiry" | "trial", id: string, status: string) {
    try {
      await updateIntakeStatus({ data: { type, id, status } });
      await qc.invalidateQueries({ queryKey: ["public-intake"] });
      toast.success("Status updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-muted-foreground">Public website submissions</p>
      <h2 className="text-lg font-semibold">Enquiries and trial registrations</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review submissions, use the email or phone link to reply, then update the status.
      </p>
      {q.isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Loading intake…</p>
      ) : q.error ? (
        <p className="py-6 text-center text-destructive">Could not load public submissions.</p>
      ) : (
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <IntakeList
            title="Contact enquiries"
            empty="No contact enquiries yet."
            rows={data.enquiries as IntakeRow[]}
            type="enquiry"
            statuses={["new", "in_progress", "resolved", "archived"]}
            onStatus={setStatus}
          >
            {(row) => (
              <>
                <p className="font-semibold">{row.name || "Unnamed contact"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Interested in: {row.programme || "General"}
                </p>
                <ContactLinks email={row.email} phone={row.phone} />
              </>
            )}
          </IntakeList>
          <IntakeList
            title="Trial registrations"
            empty="No trial registrations yet."
            rows={data.trials as IntakeRow[]}
            type="trial"
            statuses={["new", "contacted", "scheduled", "completed", "declined"]}
            onStatus={setStatus}
          >
            {(row) => (
              <>
                <p className="font-semibold">{row.player_name || "Unnamed player"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Guardian: {row.guardian_name} · {row.programme || "Programme not selected"}
                </p>
                <ContactLinks email={row.guardian_email} phone={row.guardian_phone} />
              </>
            )}
          </IntakeList>
        </div>
      )}
    </section>
  );
}

type IntakeRow = Record<string, string | null>;

function IntakeList({
  title,
  empty,
  rows,
  type,
  statuses,
  onStatus,
  children,
}: {
  title: string;
  empty: string;
  rows: IntakeRow[];
  type: "enquiry" | "trial";
  statuses: string[];
  onStatus: (type: "enquiry" | "trial", id: string, status: string) => void;
  children: (row: IntakeRow) => React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold">
        {title} ({rows.length})
      </h3>
      {rows.length === 0 ? (
        <p className="py-5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-3 divide-y rounded-xl border">
          {rows.map((row) => (
            <div key={row.id} className="p-3">
              {children(row)}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                </span>
                <select
                  value={row.status ?? statuses[0]}
                  onChange={(e) => onStatus(type, row.id!, e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  aria-label={`${title} status`}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactLinks({ email, phone }: { email: string | null; phone: string | null }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-sm">
      {email && (
        <a
          className="inline-flex items-center gap-1 text-primary underline"
          href={`mailto:${email}`}
        >
          <Mail className="h-3.5 w-3.5" />
          {email}
        </a>
      )}
      {phone && (
        <a className="inline-flex items-center gap-1 text-primary underline" href={`tel:${phone}`}>
          <Phone className="h-3.5 w-3.5" />
          {phone}
        </a>
      )}
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
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${palette}`}
    >
      {status}
    </span>
  );
}
