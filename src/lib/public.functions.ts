import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PROGRAMME_COLUMNS, normaliseSections, type Programme } from "./programmes";

function ageOf(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
/** Never expose full birth dates publicly — only age and birth year. */
function safeDob<T extends { date_of_birth: string | null }>(p: T) {
  const { date_of_birth, ...rest } = p;
  return { ...rest, age: ageOf(date_of_birth), birth_year: date_of_birth ? Number(date_of_birth.slice(0, 4)) : null };
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getProgrammes = createServerFn({ method: "GET" }).handler(async (): Promise<Programme[]> => {
  const { data, error } = await publicClient()
    .from("programmes")
    .select(PROGRAMME_COLUMNS)
    .eq("is_published", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, sections: normaliseSections(p.sections) }));
});

export const getProgramme = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }): Promise<Programme | null> => {
    const { data: p, error } = await publicClient()
      .from("programmes")
      .select(PROGRAMME_COLUMNS)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return p ? { ...p, sections: normaliseSections(p.sections) } : null;
  });

export const getPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const { data, error } = await client
    .from("player_profiles")
    .select("slug, full_name, jersey_number, position, secondary_position, preferred_foot, date_of_birth, programme, avatar_url")
    .eq("is_published", true)
    .order("jersey_number", { ascending: true });
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map(async (player) => {
    if (!player.avatar_url || /^https?:\/\//.test(player.avatar_url)) return safeDob(player);
    const { data: signed } = await client.storage.from("player-profile-media").createSignedUrl(player.avatar_url, 3600);
    return safeDob({ ...player, avatar_url: signed?.signedUrl ?? null });
  }));
});

export const getPlayer = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const c = publicClient();
    const { data: p, error } = await c
      .from("player_profiles")
      .select("id, slug, full_name, jersey_number, position, secondary_position, preferred_foot, date_of_birth, height_cm, weight_kg, nationality, programme, avatar_url, bio, overall_rating, pace, technical, tactical, physical, passing, finishing, video_cv_url, joined_on, cv_summary, updated_at")
      .eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) return null;
    const [stats, milestones, media] = await Promise.all([
      c.from("player_season_stats").select("season, appearances, minutes, goals, assists, clean_sheets, yellow_cards, red_cards, motm").eq("player_id", p.id).order("season"),
      c.from("player_milestones").select("id, phase, title, description, event_date").eq("player_id", p.id).order("sort"),
      c.from("player_media").select("id, kind, url, caption").eq("player_id", p.id).order("sort"),
    ]);
    async function signedUrl(value: string | null) {
      if (!value || /^https?:\/\//.test(value)) return value;
      const { data: signed } = await c.storage.from("player-profile-media").createSignedUrl(value, 3600);
      return signed?.signedUrl ?? null;
    }
    const resolvedMedia = await Promise.all((media.data ?? []).map(async (item) => ({ ...item, url: (await signedUrl(item.url)) ?? item.url })));
    const { id: _id, ...player } = p;
    return {
      player: { ...safeDob(player), avatar_url: await signedUrl(player.avatar_url), video_cv_url: await signedUrl(player.video_cv_url) },
      stats: stats.data ?? [], milestones: milestones.data ?? [], media: resolvedMedia,
    };
  });
