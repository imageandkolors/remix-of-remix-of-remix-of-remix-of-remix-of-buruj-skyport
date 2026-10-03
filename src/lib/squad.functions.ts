import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (error) throw new Error("Could not verify staff access");
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.some((r: string) => ["coach", "admin", "owner"].includes(r))) throw new Error("Staff access required");
}

const rating = z.number().int().min(0).max(99).nullable();
const optText = (n: number) => z.string().trim().max(n).nullable();

const playerSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, dashes"),
  jersey_number: z.number().int().min(0).max(99).nullable(),
  position: z.enum(["GK", "DEF", "MID", "FWD"]),
  secondary_position: optText(20),
  preferred_foot: z.enum(["Left", "Right", "Both"]).nullable(),
  date_of_birth: z.string().nullable(),
  joined_on: z.string().nullable(),
  height_cm: z.number().int().min(100).max(230).nullable(),
  weight_kg: z.number().int().min(25).max(150).nullable(),
  nationality: optText(60),
  programme: z.enum(["Play & Study", "Football Camping"]).nullable(),
  avatar_url: z.string().trim().url().max(500).nullable(),
  video_cv_url: z.string().trim().url().max(500).nullable(),
  bio: optText(600),
  cv_summary: optText(3000),
  overall_rating: rating, pace: rating, technical: rating, tactical: rating, physical: rating, passing: rating, finishing: rating,
  is_published: z.boolean(),
});

export const listSquad = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { data, error } = await context.supabase
      .from("player_profiles").select("id, slug, full_name, jersey_number, position, programme, is_published")
      .order("jersey_number", { ascending: true });
    if (error) throw new Error("Could not load squad");
    return data ?? [];
  });

export const getSquadPlayer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const s = context.supabase;
    const [p, stats, milestones, media] = await Promise.all([
      s.from("player_profiles").select("*").eq("id", data.id).single(),
      s.from("player_season_stats").select("*").eq("player_id", data.id).order("season"),
      s.from("player_milestones").select("*").eq("player_id", data.id).order("sort"),
      s.from("player_media").select("*").eq("player_id", data.id).order("sort"),
    ]);
    if (p.error || !p.data) throw new Error("Player not found");
    return { player: p.data, stats: stats.data ?? [], milestones: milestones.data ?? [], media: media.data ?? [] };
  });

export const savePlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => playerSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const { id, ...row } = data;
    const q = id
      ? context.supabase.from("player_profiles").update(row).eq("id", id)
      : context.supabase.from("player_profiles").insert(row);
    const { data: saved, error } = await q.select("id").single();
    if (error) throw new Error(error.code === "23505" ? "That profile link (slug) is already used" : "Could not save player");
    return { id: saved.id as string };
  });

const childSchema = z.discriminatedUnion("table", [
  z.object({ table: z.literal("player_season_stats"), row: z.object({
    player_id: z.string().uuid(), season: z.string().trim().min(4).max(20),
    appearances: z.number().int().min(0).max(200), minutes: z.number().int().min(0).max(20000),
    goals: z.number().int().min(0).max(300), assists: z.number().int().min(0).max(300),
    clean_sheets: z.number().int().min(0).max(200), yellow_cards: z.number().int().min(0).max(100),
    red_cards: z.number().int().min(0).max(50), motm: z.number().int().min(0).max(200),
  }) }),
  z.object({ table: z.literal("player_milestones"), row: z.object({
    player_id: z.string().uuid(), phase: z.enum(["before", "now", "future"]),
    title: z.string().trim().min(2).max(150), description: optText(1000), event_date: z.string().nullable(), sort: z.number().int().min(0).max(999),
  }) }),
  z.object({ table: z.literal("player_media"), row: z.object({
    player_id: z.string().uuid(), kind: z.enum(["photo", "video"]),
    url: z.string().trim().url().max(500), caption: optText(200), sort: z.number().int().min(0).max(999),
  }) }),
]);

export const addPlayerItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => childSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const q = data.table === "player_season_stats"
      ? context.supabase.from(data.table).upsert(data.row, { onConflict: "player_id,season" })
      : context.supabase.from(data.table).insert(data.row);
    const { error } = await q;
    if (error) throw new Error("Could not save item");
    return { ok: true };
  });

export const deletePlayerItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: z.enum(["player_season_stats", "player_milestones", "player_media"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error("Could not delete item");
    return { ok: true };
  });
