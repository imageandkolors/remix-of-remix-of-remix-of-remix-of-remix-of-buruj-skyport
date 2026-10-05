import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesUpdate } from "@/integrations/supabase/types";

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
  avatar_url: z.string().trim().max(500).nullable().optional(),
  video_cv_url: z.string().trim().max(500).nullable().optional(),
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
    const [p, stats, milestones, media, compliance, registrations, documents] = await Promise.all([
      s.from("player_profiles").select("*").eq("id", data.id).single(),
      s.from("player_season_stats").select("*").eq("player_id", data.id).order("season"),
      s.from("player_milestones").select("*").eq("player_id", data.id).order("sort"),
      s.from("player_media").select("*").eq("player_id", data.id).order("sort"),
      s.from("player_compliance").select("*").eq("player_id", data.id).maybeSingle(),
      s.from("player_registration_history").select("*").eq("player_id", data.id).order("start_date", { ascending: false }),
      s.from("player_documents").select("*").eq("player_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (p.error || !p.data) throw new Error("Player not found");
    return { player: p.data, stats: stats.data ?? [], milestones: milestones.data ?? [], media: media.data ?? [], compliance: compliance.data ?? null, registrations: registrations.data ?? [], documents: documents.data ?? [] };
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
    url: z.string().trim().min(1).max(500), caption: optText(200), sort: z.number().int().min(0).max(999),
  }) }),
]);

export type PlayerItemInput = z.infer<typeof childSchema>;

export const addPlayerItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => childSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const sb = context.supabase as any;
    const q = data.table === "player_season_stats"
      ? sb.from(data.table).upsert(data.row, { onConflict: "player_id,season" })
      : sb.from(data.table).insert(data.row);
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

const uploadSchema = z.object({
  playerId: z.string().uuid(),
  purpose: z.enum(["avatar", "video", "media", "document"]),
  filename: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(3).max(120),
  size: z.number().int().positive().max(104857600),
});

export const requestPlayerUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uploadSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const isImage = data.mimeType.startsWith("image/");
    const isVideo = data.mimeType.startsWith("video/");
    const isDocument = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(data.mimeType);
    if (data.purpose === "avatar" && (!isImage || data.size > 10485760)) throw new Error("Profile photos must be images under 10 MB");
    if ((data.purpose === "video" || data.purpose === "media") && !isImage && !isVideo) throw new Error("Choose an image or video file");
    if (data.purpose === "document" && (!isDocument || data.size > 20971520)) throw new Error("Documents must be PDF or images under 20 MB");
    const safeName = data.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-100);
    const path = `${data.playerId}/${data.purpose}/${crypto.randomUUID()}-${safeName}`;
    const bucket = data.purpose === "document" ? "player-documents" : "player-profile-media";
    const { data: signed, error } = await context.supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare upload");
    return { bucket, path, token: signed.token };
  });

const complianceSchema = z.object({
  player_id: z.string().uuid(),
  nff_registration_id: optText(100), fifa_connect_id: optText(100),
  passport_status: z.enum(["not_recorded", "valid", "expired", "in_progress"]),
  passport_expiry: z.string().nullable(), medical_clearance_expiry: z.string().nullable(),
  yellow_fever_expiry: z.string().nullable(), travel_consent_date: z.string().nullable(),
});

export const savePlayerCompliance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => complianceSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const { error } = await context.supabase.from("player_compliance").upsert(data, { onConflict: "player_id" });
    if (error) throw new Error("Could not save compliance record");
    return { ok: true };
  });

export const addRegistrationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ player_id: z.string().uuid(), organisation: z.string().trim().min(2).max(150), registration_body: optText(100), registration_number: optText(100), start_date: z.string().min(10).max(10), end_date: z.string().nullable(), notes: optText(1000) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    const { error } = await context.supabase.from("player_registration_history").insert(data);
    if (error) throw new Error("Could not add registration period");
    return { ok: true };
  });

export const completePlayerUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    playerId: z.string().uuid(), purpose: z.enum(["avatar", "video", "media", "document"]),
    path: z.string().min(10).max(500), mimeType: z.string().max(120), size: z.number().int().positive(),
    originalFilename: z.string().max(180), caption: optText(200), documentType: z.enum(["birth_certificate", "passport", "medical_clearance", "travel_consent", "school_record", "registration", "other"]).optional(), expiresOn: z.string().nullable().optional(), replaceId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    if (!data.path.startsWith(`${data.playerId}/`)) throw new Error("Invalid upload path");
    if (data.purpose === "avatar" || data.purpose === "video") {
      const column = data.purpose === "avatar" ? "avatar_url" : "video_cv_url";
      const { data: old } = await context.supabase.from("player_profiles").select(column).eq("id", data.playerId).single();
      const oldPath = old?.[column as keyof typeof old];
      const { error } = await context.supabase.from("player_profiles").update({ [column]: data.path } as TablesUpdate<"player_profiles">).eq("id", data.playerId);
      if (error) throw new Error("Could not attach uploaded file");
      if (typeof oldPath === "string" && !/^https?:\/\//.test(oldPath)) await context.supabase.storage.from("player-profile-media").remove([oldPath]);
    } else if (data.purpose === "media") {
      if (data.replaceId) {
        const { data: old } = await context.supabase.from("player_media").select("url").eq("id", data.replaceId).single();
        const { error } = await context.supabase.from("player_media").update({ url: data.path, kind: data.mimeType.startsWith("video/") ? "video" : "photo", caption: data.caption }).eq("id", data.replaceId);
        if (error) throw new Error("Could not replace media");
        if (old?.url && !/^https?:\/\//.test(old.url)) await context.supabase.storage.from("player-profile-media").remove([old.url]);
      } else {
        const { error } = await context.supabase.from("player_media").insert({ player_id: data.playerId, url: data.path, kind: data.mimeType.startsWith("video/") ? "video" : "photo", caption: data.caption });
        if (error) throw new Error("Could not add media");
      }
    } else {
      if (!data.documentType) throw new Error("Choose a document type");
      const { error } = await context.supabase.from("player_documents").insert({ player_id: data.playerId, document_type: data.documentType, storage_path: data.path, original_filename: data.originalFilename, mime_type: data.mimeType, size_bytes: data.size, expires_on: data.expiresOn ?? null, created_by: context.userId });
      if (error) throw new Error("Could not add document");
    }
    return { ok: true };
  });

export const removePlayerFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ playerId: z.string().uuid(), type: z.enum(["avatar", "video", "media", "document", "registration"]), id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireStaff(context);
    if (data.type === "avatar" || data.type === "video") {
      const column = data.type === "avatar" ? "avatar_url" : "video_cv_url";
      const { data: row } = await context.supabase.from("player_profiles").select(column).eq("id", data.playerId).single();
      const path = row?.[column as keyof typeof row];
      await context.supabase.from("player_profiles").update({ [column]: null } as TablesUpdate<"player_profiles">).eq("id", data.playerId);
      if (typeof path === "string" && !/^https?:\/\//.test(path)) await context.supabase.storage.from("player-profile-media").remove([path]);
    } else {
      if (!data.id) throw new Error("Missing record");
      const table = data.type === "media" ? "player_media" : data.type === "document" ? "player_documents" : "player_registration_history";
      const column = data.type === "media" ? "url" : data.type === "document" ? "storage_path" : null;
      let path: string | null = null;
      if (column) {
        const { data: row } = await context.supabase.from(table).select(column).eq("id", data.id).eq("player_id", data.playerId).single();
        path = typeof row?.[column as keyof typeof row] === "string" ? String(row[column as keyof typeof row]) : null;
      }
      await context.supabase.from(table).delete().eq("id", data.id).eq("player_id", data.playerId);
      if (path && !/^https?:\/\//.test(path)) await context.supabase.storage.from(data.type === "document" ? "player-documents" : "player-profile-media").remove([path]);
    }
    return { ok: true };
  });
