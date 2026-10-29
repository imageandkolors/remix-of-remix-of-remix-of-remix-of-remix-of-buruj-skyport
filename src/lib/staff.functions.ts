import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const statusSchema = z.enum(["submitted", "under_review", "shortlisted", "accepted", "declined"]);

async function getRole(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Could not verify staff access");
  const roles = (data ?? []).map((row: { role: string }) => row.role);
  const role = roles.includes("owner")
    ? "owner"
    : roles.includes("admin")
      ? "admin"
      : roles.includes("coach")
        ? "coach"
        : null;
  if (!role) throw new Error("Staff access required");
  return role;
}

export const getStaffDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await getRole(context);
    const [recent, total, accepted, declined] = await Promise.all([
      context.supabase
        .from("applications")
        .select("id, status, created_at, player_name, programme, current_school, guardian_email")
        .order("created_at", { ascending: false })
        .limit(12),
      context.supabase.from("applications").select("id", { count: "exact", head: true }),
      context.supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted"),
      context.supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "declined"),
    ]);
    if (recent.error || total.error || accepted.error || declined.error)
      throw new Error("Could not load dashboard");

    const totalCount = total.count ?? 0;
    const acceptedCount = accepted.count ?? 0;
    const declinedCount = declined.count ?? 0;
    return {
      recent: recent.data ?? [],
      stats: {
        total: totalCount,
        accepted: acceptedCount,
        declined: declinedCount,
        pending: Math.max(0, totalCount - acceptedCount - declinedCount),
      },
    };
  });

export const updateApplicationReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        applicationId: z.string().uuid(),
        status: statusSchema,
        reviewerId: z.string().uuid().nullable(),
        adminNotes: z.string().trim().max(3000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await getRole(context);
    if (role !== "admin" && role !== "owner") throw new Error("Admin access required");

    const { data: current, error: currentError } = await context.supabase
      .from("applications")
      .select("id, status, guardian_email, player_name, reference_number")
      .eq("id", data.applicationId)
      .single();
    if (currentError || !current) throw new Error("Application not found");

    const { data: updated, error } = await context.supabase
      .from("applications")
      .update({
        status: data.status,
        reviewer_id: data.reviewerId,
        admin_notes: data.adminNotes || null,
      })
      .eq("id", data.applicationId)
      .select("*")
      .single();
    if (error || !updated) throw new Error("Could not update application");

    return {
      application: updated,
      statusChanged: current.status !== data.status,
      notificationPending: current.status !== data.status && Boolean(current.guardian_email),
    };
  });
