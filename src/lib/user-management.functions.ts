import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { httpError } from "@/lib/http-error";

const ROLE_VALUES = ["parent", "player", "coach", "admin", "owner"] as const;
type AppRole = (typeof ROLE_VALUES)[number];
const roleSchema = z.enum(ROLE_VALUES);
const roleArraySchema = z.array(roleSchema).max(ROLE_VALUES.length);
const roleListSchema = roleArraySchema.refine(
  (roles) => new Set(roles).size === roles.length,
  "Choose each role only once",
);

async function authorizeAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<{ isOwner: boolean }> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Could not verify administrator access");
  const roles = (data ?? []).map((entry) => entry.role);
  if (!roles.includes("admin") && !roles.includes("owner")) {
    throw httpError(403, "Admin access required");
  }
  return { isOwner: roles.includes("owner") };
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function throwManagementRpcError(
  error: { message: string; code?: string } | null,
  fallback: string,
): never {
  if (!error) throw new Error(fallback);
  if (error.code === "42501")
    throw httpError(403, "You are not allowed to manage this account or role.");
  if (error.code === "23514") throw httpError(409, error.message);
  if (error.code === "P0002") throw httpError(404, "The user account no longer exists.");
  if (error.code === "22023")
    throw httpError(400, "The submitted user-management values are invalid.");
  throw new Error(fallback);
}

export type ManagedUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: AppRole[];
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  invitedAt: string | null;
  bannedUntil: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
};

export const getUserManagementPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ page: z.number().int().min(1).max(10000).default(1) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const actor = await authorizeAdmin(context);
    const admin = await getAdminClient();
    const { data: authPage, error: authError } = await admin.auth.admin.listUsers({
      page: data.page,
      perPage: 50,
    });
    if (authError) throw new Error("Could not load user accounts");

    const authUsers = authPage.users;
    const userIds = authUsers.map((user) => user.id);
    const { data: roleRows, error: rolesError } = userIds.length
      ? await admin.from("user_roles").select("user_id, role").in("user_id", userIds).limit(250)
      : { data: [], error: null };
    if (rolesError) throw new Error("Could not load user roles");

    const { data: ownerRows, error: ownerError } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .limit(100);
    if (ownerError) throw new Error("Could not verify owner assignments");

    const allStateIds = [...new Set([...userIds, ...(ownerRows ?? []).map((row) => row.user_id)])];
    const suspensionBatches = await Promise.all(
      Array.from({ length: Math.ceil(allStateIds.length / 100) }, (_, index) =>
        admin.rpc("admin_get_user_suspensions", {
          p_user_ids: allStateIds.slice(index * 100, (index + 1) * 100),
        }),
      ),
    );
    if (suspensionBatches.some(({ error }) => error)) {
      throw new Error("Could not load account access state");
    }
    const suspensionRows = suspensionBatches.flatMap(({ data }) => data ?? []);

    const roleMap = new Map<string, AppRole[]>();
    for (const row of roleRows ?? []) {
      const roles = roleMap.get(row.user_id) ?? [];
      roles.push(row.role);
      roleMap.set(row.user_id, roles);
    }
    const suspensionMap = new Map((suspensionRows ?? []).map((row) => [row.user_id, row]));
    const activeOwnerExists = (ownerRows ?? []).some((row) => !suspensionMap.has(row.user_id));

    const users: ManagedUser[] = authUsers
      .filter((user) => typeof user.email === "string")
      .map((user) => {
        const metadataName = user.user_metadata["full_name"];
        const state = suspensionMap.get(user.id);
        return {
          id: user.id,
          email: user.email!,
          displayName: typeof metadataName === "string" ? metadataName.slice(0, 120) : null,
          roles: (roleMap.get(user.id) ?? []).sort(
            (a, b) => ROLE_VALUES.indexOf(a) - ROLE_VALUES.indexOf(b),
          ),
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at ?? null,
          emailConfirmedAt: user.email_confirmed_at ?? null,
          invitedAt: user.invited_at ?? null,
          bannedUntil: user.banned_until ?? null,
          suspendedAt: state?.suspended_at ?? null,
          suspensionReason: state?.reason ?? null,
        };
      });

    return {
      users,
      page: data.page,
      total: authPage.total,
      lastPage: Math.max(1, Math.ceil((authPage.total ?? 0) / 50)),
      actorId: context.userId,
      isOwner: actor.isOwner,
      canAssignOwner: actor.isOwner || !activeOwnerExists,
    };
  });

type SuspensionRow = {
  user_id: string;
  suspended_at: string;
  suspended_by: string | null;
  reason: string | null;
};

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((email) => email.toLowerCase()),
  roles: roleArraySchema
    .min(1)
    .refine((roles) => new Set(roles).size === roles.length, "Choose each role only once"),
});

function inviteRedirectUrl(roles: AppRole[]): string {
  const configured = process.env["SITE_URL"];
  if (!configured)
    throw new Error("Set SITE_URL in the server runtime before sending invitations.");
  let site: URL;
  try {
    site = new URL(configured);
  } catch {
    throw new Error("SITE_URL must be a valid production website origin.");
  }
  const local = site.hostname === "localhost" || site.hostname === "127.0.0.1";
  if (site.protocol !== "https:" && !(local && site.protocol === "http:")) {
    throw new Error("User invitations require an HTTPS SITE_URL.");
  }
  const invite = new URL("/auth", site);
  invite.searchParams.set("mode", "invite");
  invite.searchParams.set(
    "redirect",
    roles.some((role) => role === "admin" || role === "owner" || role === "coach")
      ? "/dashboard"
      : "/portal",
  );
  return invite.toString();
}

export const inviteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteSchema.parse(input))
  .handler(async ({ context, data }) => {
    await authorizeAdmin(context);
    const admin = await getAdminClient();
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: inviteRedirectUrl(data.roles),
      },
    );
    if (inviteError || !invite.user) {
      throw new Error(
        "Could not send the invitation. Check the address and whether an account already exists.",
      );
    }

    const { error: roleError } = await admin.rpc("admin_set_user_roles", {
      p_actor_id: context.userId,
      p_target_id: invite.user.id,
      p_roles: data.roles,
      p_action: "invite",
    });
    if (roleError) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(invite.user.id);
      if (rollbackError) {
        throw new Error(
          "The invitation was created but role assignment failed. The account has no app role; remove or retry it from User Management.",
        );
      }
      throwManagementRpcError(
        roleError,
        "Could not assign the requested role; the invitation was canceled.",
      );
    }
    return { ok: true };
  });

export const updateManagedUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), roles: roleListSchema }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await authorizeAdmin(context);
    const admin = await getAdminClient();
    const { error } = await admin.rpc("admin_set_user_roles", {
      p_actor_id: context.userId,
      p_target_id: data.userId,
      p_roles: data.roles,
      p_action: "roles_changed",
    });
    if (error) throwManagementRpcError(error, "Could not update user roles");
    return { ok: true };
  });

export const setManagedUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await authorizeAdmin(context);
    const admin = await getAdminClient();

    if (data.suspended) {
      const { error: stateError } = await admin.rpc("admin_set_user_suspension", {
        p_actor_id: context.userId,
        p_target_id: data.userId,
        p_suspended: true,
        ...(data.reason === undefined ? {} : { p_reason: data.reason }),
      });
      if (stateError) throwManagementRpcError(stateError, "Could not suspend this account");

      const { error: authError } = await admin.auth.admin.updateUserById(data.userId, {
        ban_duration: "876000h",
      });
      return {
        ok: true,
        warning: authError
          ? "App access is revoked, but Supabase could not block future sign-ins. Retry suspension or contact the project administrator."
          : null,
      };
    }

    const { error: unbanError } = await admin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    });
    if (unbanError) throw new Error("Could not restore sign-in; the account remains suspended.");

    const { error: stateError } = await admin.rpc("admin_set_user_suspension", {
      p_actor_id: context.userId,
      p_target_id: data.userId,
      p_suspended: false,
    });
    if (stateError) {
      throw new Error(
        "Sign-in was restored, but application access remains suspended. Retry the restore action.",
      );
    }
    return { ok: true, warning: null };
  });

export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ userId: z.string().uuid(), confirmationEmail: z.string().trim().email().max(320) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await authorizeAdmin(context);
    const admin = await getAdminClient();

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(
      data.userId,
    );
    if (authUserError || !authUser.user?.email) {
      throw new Error("Could not verify the account email; no changes were made.");
    }
    if (authUser.user.email.trim().toLowerCase() !== data.confirmationEmail.toLowerCase()) {
      throw httpError(400, "The confirmation email does not match this account.");
    }

    const { count, error: documentsError } = await admin
      .from("player_documents")
      .select("id", { count: "exact", head: true })
      .eq("created_by", data.userId);
    if (documentsError) throw new Error("Could not verify whether this account owns staff records");
    if ((count ?? 0) > 0) {
      throw httpError(
        409,
        "This account authored player documents. Reassign those records before permanent deletion; you can suspend the account now instead.",
      );
    }

    const { error: stateError } = await admin.rpc("admin_set_user_suspension", {
      p_actor_id: context.userId,
      p_target_id: data.userId,
      p_suspended: true,
      p_reason: "Permanent deletion requested by an administrator",
    });
    if (stateError) throwManagementRpcError(stateError, "Could not revoke account access");

    const { error: banError } = await admin.auth.admin.updateUserById(data.userId, {
      ban_duration: "876000h",
    });
    if (banError) {
      throw new Error(
        "Application access is revoked, but deletion stopped because sign-in could not be blocked.",
      );
    }

    const { error: rolesError } = await admin.rpc("admin_set_user_roles", {
      p_actor_id: context.userId,
      p_target_id: data.userId,
      p_roles: [],
      p_action: "roles_changed",
    });
    if (rolesError) {
      throwManagementRpcError(rolesError, "Could not remove application roles before deletion");
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(data.userId);
    if (deleteError) {
      throw new Error(
        "The account is suspended and its app roles are removed, but permanent deletion failed. Resolve linked records and retry; reassign roles only if access should be restored.",
      );
    }

    const { error: auditError } = await admin.rpc("admin_log_user_action", {
      p_actor_id: context.userId,
      p_target_id: data.userId,
      p_action: "deleted",
      p_details: {},
    });
    return {
      ok: true,
      warning: auditError
        ? "The account was deleted, but the audit event could not be recorded."
        : null,
    };
  });
