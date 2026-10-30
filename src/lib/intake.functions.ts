import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { httpError } from "@/lib/http-error";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255).nullable(),
  phone: z.string().trim().max(30).nullable(),
  programme: z.string().trim().max(120).nullable(),
  message: z.string().trim().min(5).max(3000),
});

const trialSchema = z.object({
  player_name: z.string().trim().min(2).max(120),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  position: z.string().trim().max(60).nullable(),
  guardian_name: z.string().trim().min(2).max(120),
  guardian_phone: z.string().trim().min(7).max(30),
  guardian_email: z.string().trim().toLowerCase().email().max(255).nullable(),
  programme: z.string().trim().max(120).nullable(),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { enforcePublicIntakeRateLimit } = await import("./public-intake-rate-limit.server");
    await enforcePublicIntakeRateLimit(
      "enquiry",
      data.email ? `email:${data.email}` : `phone:${data.phone ?? data.name}`,
      5,
      3600,
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("enquiries").insert({
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      programme: data.programme || null,
      status: "new",
    });
    if (error) throw new Error("Could not send enquiry");
    return { ok: true };
  });

export const submitTrialRegistration = createServerFn({ method: "POST" })
  .inputValidator((d) => trialSchema.parse(d))
  .handler(async ({ data }) => {
    const { enforcePublicIntakeRateLimit } = await import("./public-intake-rate-limit.server");
    await enforcePublicIntakeRateLimit(
      "trial",
      data.guardian_email
        ? `email:${data.guardian_email}`
        : `phone:${data.guardian_phone.replace(/\D/g, "")}`,
      5,
      3600,
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("trial_registrations").insert({
      ...data,
      date_of_birth: data.date_of_birth || null,
      position: data.position || null,
      guardian_email: data.guardian_email || null,
      programme: data.programme || null,
      status: "new",
    });
    if (error) throw new Error("Could not submit trial registration");
    return { ok: true };
  });

async function requireStaff(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error) throw new Error("Could not verify staff access");
  if (!data) throw httpError(403, "Staff access required");
}

export const listIntake = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [enquiries, trials] = await Promise.all([
      supabaseAdmin
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("trial_registrations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (enquiries.error || trials.error) throw new Error("Could not load public enquiries");
    return { enquiries: enquiries.data ?? [], trials: trials.data ?? [] };
  });

export const updateIntakeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["enquiry", "trial"]),
        id: z.string().uuid(),
        status: z.string().trim().min(1).max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const allowed =
      data.type === "enquiry"
        ? ["new", "in_progress", "resolved", "archived"]
        : ["new", "contacted", "scheduled", "completed", "declined"];
    if (!allowed.includes(data.status)) throw new Error("Invalid intake status");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } =
      data.type === "enquiry"
        ? await supabaseAdmin.from("enquiries").update({ status: data.status }).eq("id", data.id)
        : await supabaseAdmin
            .from("trial_registrations")
            .update({ status: data.status })
            .eq("id", data.id);
    if (error) throw new Error("Could not update intake status");
    return { ok: true };
  });
