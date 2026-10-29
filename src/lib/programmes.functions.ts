import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROGRAMME_COLUMNS, normaliseSections, type Programme } from "./programmes";
import type { Database } from "@/integrations/supabase/types";

async function requireManager(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Could not verify staff access");
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("owner"))
    throw new Error("Admin access required");
}

const sectionSchema = z.object({
  title: z.string().trim().max(160),
  body: z.string().trim().max(3000),
  items: z.array(z.string().trim().max(400)).max(40),
});

const programmeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(300).nullable(),
  age_range: z.string().trim().max(80).nullable(),
  session_label: z.string().trim().max(120).nullable(),
  fee_amount: z.number().nonnegative().max(1_000_000_000).nullable(),
  fee_period: z.string().trim().max(60).nullable(),
  fee_confirmed: z.boolean(),
  non_refundable: z.boolean(),
  inclusions: z.array(z.string().trim().max(300)).max(20),
  intro: z.string().trim().max(5000).nullable(),
  sections: z.array(sectionSchema).max(20),
  trial_countries: z.array(z.string().trim().max(80)).max(30),
  note: z.string().trim().max(2000).nullable(),
  cta_title: z.string().trim().max(160).nullable(),
  cta_body: z.string().trim().max(1000).nullable(),
  cta_label: z.string().trim().max(80).nullable(),
  is_published: z.boolean(),
  display_order: z.number().int().min(0).max(999),
});

export const listProgrammesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Programme[]> => {
    await requireManager(context);
    const { data, error } = await context.supabase
      .from("programmes")
      .select(PROGRAMME_COLUMNS)
      .order("display_order");
    if (error) throw new Error("Could not load programmes");
    return (data ?? []).map((p) => ({ ...p, sections: normaliseSections(p.sections) }));
  });

export const saveProgramme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => programmeSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireManager(context);
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const q = id
      ? context.supabase.from("programmes").update(payload).eq("id", id)
      : context.supabase.from("programmes").insert(payload);
    const { error } = await q;
    if (error)
      throw new Error(
        error.message.includes("duplicate")
          ? "That web address is already used"
          : "Could not save programme",
      );
    return { ok: true };
  });

export const deleteProgramme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireManager(context);
    const { error } = await context.supabase.from("programmes").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete programme");
    return { ok: true };
  });
