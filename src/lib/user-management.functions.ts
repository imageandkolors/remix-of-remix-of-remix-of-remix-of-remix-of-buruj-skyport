import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { httpError } from "@/lib/http-error";

type AppRole = Database["public"]["Enums"]["app_role"];
type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

const roleSchema = z.enum(["parent", "player", "coach", "admin", "owner"]);
const rolesSchema = z
  .array(roleSchema)
  .max(5)
  .refine((roles) => new Set(roles).size === roles.length);

async function requireAdmin(context: AuthContext) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Could not verify administrator access");
  const roles = (data ?? []).map((row) => row.role);
  if (!roles.includes("admin") && !roles.includes("owner")) {
    throw httpError(403, "Administrator access required");
  }
  return { isOwner: roles.includes("owner") };
}

async function getSuspensions(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabaseAdmin.rpc("admin_get_user_suspensions", {
    p_user_ids: userIds,
  });
  if (error) throw new Error("Could not load user status");
  return data ?? [];
}

async function listManagedUsers() {
  const [{ data: authData, error: authError }, { data: roleRows, error: roleError }] =
    await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
  if (authError || roleError) throw new Error("Could not load users");

  const users = authData.users ?? [];
  const ids = users.map((user) => user.id);
  const suspensions = await getSuspensions(ids);
  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    const roles = rolesByUser.get(row.user_id) ?? [];
    roles.push(row.role);
    rolesByUser.set(row.user_id, roles);
  }
  const suspensionByUser = new Map(suspensions.map((row) => [row.user_id, row]));

  return users
    .map((user) => {
      const suspension = suspensionByUser.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
        phone: user.phone ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmed: Boolean(user.email_confirmed_at),
        roles: rolesByUser.get(user.id) ?? [],
        suspended: Boolean(suspension),
        suspensionReason: suspension?.reason ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

export const listManagedUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    return listManagedUsers();
  });

export const inviteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(254),
        fullName: z.string().trim().min(2).max(120),
        roles: rolesSchema.min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { isOwner } = await requireAdmin(context);
    if (data.roles.includes("owner") && !isOwner) {
      throw httpError(403, "Only an owner may invite an owner");
    }

    const siteUrl = process.env.VITE_SITE_URL;
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName },
      ...(siteUrl ? { redirectTo: `${siteUrl.replace(/\/$/, "")}/auth` } : {}),
    });
    if (error || !invited.user) throw new Error(error?.message || "Could not invite user");

    const userId = invited.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.fullName,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not create the user profile");
    }

    const { error: roleError } = await supabaseAdmin.rpc("admin_set_user_roles", {
      p_action: "invite",
      p_actor_id: context.userId,
      p_roles: data.roles,
      p_target_id: userId,
    });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(roleError.message || "Could not assign the initial role");
    }

    return { id: userId };
  });

export const setManagedUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), roles: rolesSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { isOwner } = await requireAdmin(context);
    if (data.userId === context.userId) throw httpError(400, "You cannot change your own roles");
    if (data.roles.includes("owner") && !isOwner) {
      throw httpError(403, "Only an owner may assign an owner role");
    }
    const { error } = await supabaseAdmin.rpc("admin_set_user_roles", {
      p_action: "roles_changed",
      p_actor_id: context.userId,
      p_roles: data.roles,
      p_target_id: data.userId,
    });
    if (error) throw new Error(error.message || "Could not update user roles");
    return { ok: true };
  });

export const setManagedUserSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().trim().max(500).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.userId === context.userId) throw httpError(400, "You cannot suspend yourself");
    const { error } = await supabaseAdmin.rpc("admin_set_user_suspension", {
      p_actor_id: context.userId,
      p_reason: data.reason,
      p_suspended: data.suspended,
      p_target_id: data.userId,
    });
    if (error) throw new Error(error.message || "Could not update user status");
    return { ok: true };
  });

export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { isOwner } = await requireAdmin(context);
    if (data.userId === context.userId) throw httpError(400, "You cannot delete your own account");

    const users = await listManagedUsers();
    const target = users.find((user) => user.id === data.userId);
    if (!target) throw new Error("User not found");
    if (target.roles.includes("owner") && !isOwner) {
      throw httpError(403, "Only an owner may delete an owner account");
    }

    const activeElevated = users.filter(
      (user) => !user.suspended && user.roles.some((role) => role === "admin" || role === "owner"),
    );
    const activeOwners = users.filter((user) => !user.suspended && user.roles.includes("owner"));
    if (target.roles.includes("owner") && activeOwners.length <= 1) {
      throw httpError(400, "The final active owner cannot be deleted");
    }
    if (
      target.roles.some((role) => role === "admin" || role === "owner") &&
      activeElevated.length <= 1
    ) {
      throw httpError(400, "The final active administrator cannot be deleted");
    }

    const { error: auditError } = await supabaseAdmin.rpc("admin_log_user_action", {
      p_action: "deleted",
      p_actor_id: context.userId,
      p_details: { email: target.email, roles: target.roles },
      p_target_id: data.userId,
    });
    if (auditError) throw new Error(auditError.message || "Could not record the deletion");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message || "Could not delete user");
    return { ok: true };
  });
