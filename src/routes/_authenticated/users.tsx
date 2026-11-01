import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MailPlus,
  Search,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteManagedUser,
  getUserManagementPage,
  inviteManagedUser,
  setManagedUserSuspended,
  updateManagedUserRoles,
  type ManagedUser,
} from "@/lib/user-management.functions";

type AppRole = "parent" | "player" | "coach" | "admin" | "owner";
type ConfirmAction = { kind: "suspend" | "reactivate" | "delete"; user: ManagedUser } | null;

function safeLoadErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || /<!doctype\s+html|<html[\s>]/i.test(message)) return fallback;
  return message;
}

const ROLE_OPTIONS: { role: AppRole; label: string; description: string }[] = [
  { role: "parent", label: "Parent", description: "Parent portal account" },
  { role: "player", label: "Player", description: "Player account" },
  { role: "coach", label: "Coach", description: "Staff and squad access" },
  { role: "admin", label: "Admin", description: "Manage academy content and users" },
  { role: "owner", label: "Owner", description: "Full administration and owner management" },
];

export const Route = createFileRoute("/_authenticated/users")({
  beforeLoad: ({ context }) => {
    if (!context.canManageUsers) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "User Management — Buruj Sports Academy" },
      { name: "description", content: "Invite users and manage account access and roles." },
    ],
  }),
  component: UserManagementPage,
});

function UserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoles, setInviteRoles] = useState<AppRole[]>(["coach"]);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editingRoles, setEditingRoles] = useState<AppRole[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [typedEmail, setTypedEmail] = useState("");

  const usersQuery = useQuery({
    queryKey: ["user-management", page],
    queryFn: () => getUserManagementPage({ data: { page } }),
  });
  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["user-management"] });

  const inviteMutation = useMutation({
    mutationFn: () => inviteManagedUser({ data: { email: inviteEmail, roles: inviteRoles } }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRoles(["coach"]);
      void refreshUsers();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not send invitation")),
  });

  const rolesMutation = useMutation({
    mutationFn: () => {
      if (!editingUser) throw new Error("Choose a user first");
      return updateManagedUserRoles({ data: { userId: editingUser.id, roles: editingRoles } });
    },
    onSuccess: () => {
      toast.success("User roles updated");
      setEditingUser(null);
      void refreshUsers();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update roles")),
  });

  const suspensionMutation = useMutation({
    mutationFn: (input: { userId: string; suspended: boolean }) =>
      setManagedUserSuspended({ data: input }),
    onSuccess: (result) => {
      if (result.warning) toast.error(result.warning);
      else toast.success(result.ok ? "Account access updated" : "Account update complete");
      setConfirmAction(null);
      void refreshUsers();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update account access")),
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { userId: string; confirmationEmail: string }) =>
      deleteManagedUser({ data: input }),
    onSuccess: (result) => {
      if (result.warning) toast.error(result.warning);
      else toast.success("User account deleted");
      setConfirmAction(null);
      setTypedEmail("");
      void refreshUsers();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete this user")),
  });

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data?.users ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.email, user.displayName ?? "", user.roles.join(" ")].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [usersQuery.data?.users, search]);

  function openRoleEditor(user: ManagedUser) {
    setEditingUser(user);
    setEditingRoles([...user.roles]);
  }

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    await inviteMutation.mutateAsync();
  }

  async function confirmSelectedAction(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!confirmAction) return;
    if (confirmAction.kind === "delete") {
      await deleteMutation.mutateAsync({
        userId: confirmAction.user.id,
        confirmationEmail: typedEmail.trim(),
      });
      return;
    }
    await suspensionMutation.mutateAsync({
      userId: confirmAction.user.id,
      suspended: confirmAction.kind === "suspend",
    });
  }

  const currentPage = usersQuery.data?.page ?? page;
  const lastPage = usersQuery.data?.lastPage ?? 1;
  const actionPending = suspensionMutation.isPending || deleteMutation.isPending;
  const deleteConfirmed =
    confirmAction?.kind === "delete" &&
    typedEmail.trim().toLowerCase() === confirmAction.user.email.toLowerCase();

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-secondary px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-extrabold uppercase text-navy sm:text-4xl">
              User management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Invite accounts, assign roles, suspend sign-in, revoke app access, or permanently
              delete a user. All changes are checked again on the server.
            </p>
          </div>
          <Button
            onClick={() => setInviteOpen(true)}
            className="shrink-0 font-display font-bold uppercase"
          >
            <MailPlus className="h-4 w-4" /> Invite user
          </Button>
        </header>

        {usersQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {safeLoadErrorMessage(
              usersQuery.error,
              "Could not load user accounts. Verify SUPABASE_SERVICE_ROLE_KEY is set in the cPanel Node.js runtime for the same project as SUPABASE_URL, then restart the app. Do not prefix the key with VITE_.",
            )}
          </div>
        ) : null}

        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Accounts</h2>
              <p className="text-sm text-muted-foreground">
                {usersQuery.data ? `${usersQuery.data.total} total accounts` : "Loading accounts…"}
                {search ? " · filtering this page" : " · 50 accounts per page"}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Label className="sr-only" htmlFor="user-search">
                Search current page
              </Label>
              <Input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search current page"
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="border-b px-3 py-3 font-semibold">User</th>
                  <th className="border-b px-3 py-3 font-semibold">Roles</th>
                  <th className="border-b px-3 py-3 font-semibold">Account status</th>
                  <th className="border-b px-3 py-3 font-semibold">Last sign-in</th>
                  <th className="border-b px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      Loading users…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      No users match this page filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === usersQuery.data?.actorId;
                    const isProtectedOwner =
                      user.roles.includes("owner") && !usersQuery.data?.isOwner;
                    const invited = Boolean(user.invitedAt && !user.emailConfirmedAt);
                    return (
                      <tr key={user.id} className="align-top">
                        <td className="border-b px-3 py-4">
                          <div className="font-medium text-foreground">
                            {user.displayName || user.email}
                          </div>
                          {user.displayName ? (
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          ) : null}
                          <div className="mt-1 text-xs text-muted-foreground">
                            Created {formatDate(user.createdAt)}
                            {invited ? " · invitation pending" : ""}
                          </div>
                        </td>
                        <td className="border-b px-3 py-4">
                          <div className="flex max-w-60 flex-wrap gap-1.5">
                            {user.roles.length ? (
                              user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium capitalize"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No app roles</span>
                            )}
                          </div>
                        </td>
                        <td className="border-b px-3 py-4">
                          <StatusPill suspended={Boolean(user.suspendedAt)} invited={invited} />
                          {user.suspendedAt ? (
                            <div className="mt-1 max-w-48 text-xs text-muted-foreground">
                              {user.suspensionReason || "Access revoked by administrator"}
                            </div>
                          ) : null}
                        </td>
                        <td className="border-b px-3 py-4 text-muted-foreground">
                          {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}
                        </td>
                        <td className="border-b px-3 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRoleEditor(user)}
                              disabled={isSelf || isProtectedOwner}
                              title={
                                isSelf
                                  ? "You cannot change your own roles here"
                                  : isProtectedOwner
                                    ? "Only an owner can manage owner accounts"
                                    : undefined
                              }
                            >
                              <ShieldCheck className="h-4 w-4" /> Roles
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTypedEmail("");
                                setConfirmAction({
                                  kind: user.suspendedAt ? "reactivate" : "suspend",
                                  user,
                                });
                              }}
                              disabled={isSelf || isProtectedOwner}
                              title={
                                isSelf
                                  ? "You cannot suspend your own account"
                                  : isProtectedOwner
                                    ? "Only an owner can manage owner accounts"
                                    : undefined
                              }
                            >
                              {user.suspendedAt ? "Restore" : "Suspend"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setTypedEmail("");
                                setConfirmAction({ kind: "delete", user });
                              }}
                              disabled={isSelf || isProtectedOwner}
                              title={
                                isSelf
                                  ? "You cannot delete your own account"
                                  : isProtectedOwner
                                    ? "Only an owner can manage owner accounts"
                                    : undefined
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || usersQuery.isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage || usersQuery.isFetching}
                onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground sm:grid-cols-3 sm:p-5">
          <p>
            <b className="text-foreground">Role access:</b> remove all app roles to revoke
            privileged access while preserving the account.
          </p>
          <p>
            <b className="text-foreground">Suspension:</b> blocks app authorization immediately and
            bans future sign-ins; restore keeps the assigned roles.
          </p>
          <p>
            <b className="text-foreground">Deletion:</b> permanent. Accounts that authored player
            documents must be reassigned before deletion.
          </p>
        </section>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              Supabase sends a one-time invitation link. The selected roles are assigned before the
              user can enter the app.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInvite} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                maxLength={255}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </div>
            <RoleChecklist
              selected={inviteRoles}
              onChange={setInviteRoles}
              allowOwner={Boolean(usersQuery.data?.canAssignOwner)}
            />
            <p className="text-xs text-muted-foreground">
              Owner access can only be assigned by an existing owner, except for bootstrapping the
              first active owner.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending || inviteRoles.length === 0}>
                {inviteMutation.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage roles</DialogTitle>
            <DialogDescription>
              {editingUser?.email} · select zero or more roles. Removing every role revokes app
              access without deleting the account.
            </DialogDescription>
          </DialogHeader>
          <RoleChecklist
            selected={editingRoles}
            onChange={setEditingRoles}
            allowOwner={Boolean(usersQuery.data?.canAssignOwner)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void rolesMutation.mutateAsync()}
              disabled={rolesMutation.isPending}
            >
              {rolesMutation.isPending ? "Saving…" : "Save roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open && !actionPending) {
            setConfirmAction(null);
            setTypedEmail("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === "delete"
                ? "Permanently delete this user?"
                : confirmAction?.kind === "suspend"
                  ? "Suspend this account?"
                  : "Restore this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "delete"
                ? `This permanently deletes ${confirmAction.user.email} from Supabase Auth and removes its role records. Linked application/profile records are retained where the database allows it. This cannot be undone.`
                : confirmAction?.kind === "suspend"
                  ? `This immediately blocks ${confirmAction?.user.email} from role-protected app access and bans future sign-ins. Existing roles are preserved for a later restore.`
                  : `This restores sign-in and application access for ${confirmAction?.user.email} using the current role assignments.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction?.kind === "delete" ? (
            <div className="space-y-1.5">
              <Label htmlFor="confirm-delete-email">Type the email address to confirm</Label>
              <Input
                id="confirm-delete-email"
                autoComplete="off"
                value={typedEmail}
                onChange={(event) => setTypedEmail(event.target.value)}
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.kind === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              disabled={actionPending || (confirmAction?.kind === "delete" && !deleteConfirmed)}
              onClick={(event) => void confirmSelectedAction(event)}
            >
              {actionPending
                ? "Working…"
                : confirmAction?.kind === "delete"
                  ? "Delete permanently"
                  : confirmAction?.kind === "suspend"
                    ? "Suspend account"
                    : "Restore account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function RoleChecklist({
  selected,
  onChange,
  allowOwner,
}: {
  selected: AppRole[];
  onChange: (roles: AppRole[]) => void;
  allowOwner: boolean;
}) {
  const options = ROLE_OPTIONS.filter(
    (option) => option.role !== "owner" || allowOwner || selected.includes("owner"),
  );
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Assigned roles</legend>
      {options.map((option) => (
        <label
          key={option.role}
          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-primary"
            checked={selected.includes(option.role)}
            onChange={(event) => {
              const next = event.target.checked
                ? [...selected, option.role]
                : selected.filter((role) => role !== option.role);
              onChange(next);
            }}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="block text-xs text-muted-foreground">{option.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function StatusPill({ suspended, invited }: { suspended: boolean; invited: boolean }) {
  const label = suspended ? "Suspended" : invited ? "Invitation pending" : "Active";
  const classes = suspended
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
    : invited
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
