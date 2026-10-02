import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusSchema = z.enum(["submitted", "under_review", "shortlisted", "accepted", "declined"]);

async function getRole(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Could not verify staff access");
  const roles = (data ?? []).map((row: { role: string }) => row.role);
  const role = roles.includes("owner") ? "owner" : roles.includes("admin") ? "admin" : roles.includes("coach") ? "coach" : null;
  if (!role) throw new Error("Staff access required");
  return role;
}

export const getStaffDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getRole(context);
    const { data: applications, error } = await context.supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load applications");

    let reviewers: Array<{ id: string; full_name: string | null; role: string }> = [];
    if (role === "admin" || role === "owner") {
      const { data: roleRows, error: rolesError } = await context.supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["coach", "admin", "owner"]);
      if (rolesError) throw new Error("Could not load reviewers");
      const ids = [...new Set((roleRows ?? []).map((row: { user_id: string }) => row.user_id))];
      if (ids.length > 0) {
        const { data: profiles, error: profilesError } = await context.supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        if (profilesError) throw new Error("Could not load reviewer profiles");
        reviewers = (profiles ?? []).map((profile: { id: string; full_name: string | null }) => ({
          ...profile,
          role: roleRows?.find((row: { user_id: string; role: string }) => row.user_id === profile.id)?.role ?? "coach",
        }));
      }
    }

    return { applications: applications ?? [], reviewers, role, userId: context.userId };
  });

export const updateApplicationReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    applicationId: z.string().uuid(),
    status: statusSchema,
    reviewerId: z.string().uuid().nullable(),
    adminNotes: z.string().trim().max(3000),
  }).parse(input))
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
      .update({ status: data.status, reviewer_id: data.reviewerId, admin_notes: data.adminNotes || null })
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