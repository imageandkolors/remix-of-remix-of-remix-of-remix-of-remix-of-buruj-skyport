import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Shield, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteManagedUser,
  inviteManagedUser,
  listManagedUsersFn,
  setManagedUserRoles,
  setManagedUserSuspension,
} from "@/lib/user-management.functions";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User management — Buruj Sports Academy" },
      { name: "description", content: "Manage academy administrator and staff accounts." },
    ],
  }),
  component: UsersPage,
});

type AppRole = Database["public"]["Enums"]["app_role"];
const ROLE_OPTIONS: AppRole[] = ["parent", "player", "coach", "admin", "owner"];

type ManagedUser = Awaited<ReturnType<typeof listManagedUsersFn>>[number];

function UsersPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["managed-users"], queryFn: () => listManagedUsersFn() });
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("coach");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["managed-users"] });
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await inviteManagedUser({ data: { email, fullName, roles: [role] } });
      setEmail("");
      setFullName("");
      toast.success("Invitation sent");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite user");
    } finally {
      setBusy(false);
    }
  }

  async function changeRoles(user: ManagedUser, nextRole: AppRole | "revoked") {
    try {
      await setManagedUserRoles({
        data: { userId: user.id, roles: nextRole === "revoked" ? [] : [nextRole] },
      });
      toast.success(nextRole === "revoked" ? "All roles revoked" : "Role updated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role");
    }
  }

  async function toggleSuspension(user: ManagedUser) {
    const reason = user.suspended
      ? null
      : (window.prompt("Reason for suspending this user:", "") ?? null);
    if (!user.suspended && reason === null) return;
    try {
      await setManagedUserSuspension({
        data: { userId: user.id, suspended: !user.suspended, reason },
      });
      toast.success(user.suspended ? "User reactivated" : "User suspended");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user status");
    }
  }

  async function remove(user: ManagedUser) {
    if (!window.confirm(`Delete ${user.email}? This permanently removes the Auth account.`)) return;
    try {
      await deleteManagedUser({ data: { userId: user.id } });
      toast.success("User deleted");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete user");
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Administration
            </p>
            <h1 className="text-4xl font-extrabold uppercase text-navy">User management</h1>
            <p className="mt-1 text-muted-foreground">
              Invite users, assign roles, revoke access, suspend, or permanently delete accounts.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-sky" /> Protected admin actions
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-sky" />
            <h2 className="text-lg font-semibold">Invite a user</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            The user receives an email invitation and is assigned the selected initial role.
          </p>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={invite}>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
            />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Email address"
              required
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy}>
              {busy ? "Inviting…" : "Send invitation"}
            </Button>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Role changes are audited. The final active owner or administrator cannot be removed.
            </p>
          </div>
          {users.isLoading ? (
            <p className="p-8 text-center text-muted-foreground">Loading users…</p>
          ) : null}
          {users.error ? (
            <p className="p-8 text-center text-destructive">{users.error.message}</p>
          ) : null}
          {!users.isLoading && !users.error ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onRoleChange={changeRoles}
                      onToggleSuspension={toggleSuspension}
                      onDelete={remove}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onRoleChange,
  onToggleSuspension,
  onDelete,
}: {
  user: ManagedUser;
  onRoleChange: (user: ManagedUser, role: AppRole | "revoked") => Promise<void>;
  onToggleSuspension: (user: ManagedUser) => Promise<void>;
  onDelete: (user: ManagedUser) => Promise<void>;
}) {
  const currentRole = user.roles[0] ?? "revoked";
  return (
    <tr className="border-t align-top">
      <td className="px-4 py-4">
        <p className="font-medium">{user.fullName || "Unnamed user"}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </td>
      <td className="px-4 py-4">
        <select
          value={currentRole}
          onChange={(event) => void onRoleChange(user, event.target.value as AppRole | "revoked")}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="revoked">Revoked</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.suspended ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {user.suspended ? "Suspended" : "Active"}
        </span>
        {!user.emailConfirmed ? (
          <p className="mt-1 text-xs text-amber-600">Invitation pending</p>
        ) : null}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void onToggleSuspension(user)}>
            {user.suspended ? "Reactivate" : "Suspend"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => void onDelete(user)}>
            <UserX className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
