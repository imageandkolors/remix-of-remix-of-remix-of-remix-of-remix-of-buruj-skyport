import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestPlayerCv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    slug: z.string().max(120),
    requester_name: z.string().trim().min(2).max(120),
    organisation: z.string().trim().min(2).max(150),
    role: z.string().trim().max(80).optional(),
    email: z.string().trim().email().max(255),
    country: z.string().trim().max(80).optional(),
    purpose: z.enum(["Trial invitation", "Scouting", "Transfer enquiry", "Scholarship", "Other"]),
    message: z.string().trim().max(1500).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("player_profiles").select("id").eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (!p) throw new Error("Player not found");
    const { slug: _s, ...row } = data;
    const { error } = await supabaseAdmin.from("player_cv_requests").insert({ ...row, player_id: p.id, role: row.role || null, country: row.country || null, message: row.message || null });
    if (error) throw new Error("Could not send request");
    return { ok: true };
  });

export const listCvRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("player_cv_requests").select("*, player_profiles(full_name, slug)").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Staff access required");
    return data ?? [];
  });

export const setCvRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["new", "sent", "declined"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!ok) throw new Error("Staff access required");
    await context.supabase.from("player_cv_requests").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });
