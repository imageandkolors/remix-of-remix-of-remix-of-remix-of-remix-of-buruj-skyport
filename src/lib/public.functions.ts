import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

export const getProgrammes = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("programmes")
    .select("slug, name, age_range, fee_amount, fee_period, fee_confirmed, inclusions")
    .order("name", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("news_posts")
    .select("id, title, excerpt, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("player_profiles")
    .select("slug, full_name, jersey_number, position, secondary_position, preferred_foot, date_of_birth, programme, avatar_url")
    .eq("is_published", true)
    .order("jersey_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPlayer = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const c = publicClient();
    const { data: p, error } = await c
      .from("player_profiles")
      .select("id, slug, full_name, jersey_number, position, secondary_position, preferred_foot, date_of_birth, height_cm, weight_kg, nationality, programme, avatar_url, bio, overall_rating, pace, technical, tactical, physical, passing, finishing, video_cv_url, joined_on, cv_summary")
      .eq("slug", data.slug).eq("is_published", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) return null;
    const [stats, milestones, media] = await Promise.all([
      c.from("player_season_stats").select("season, appearances, minutes, goals, assists, clean_sheets, yellow_cards, red_cards, motm").eq("player_id", p.id).order("season"),
      c.from("player_milestones").select("id, phase, title, description, event_date").eq("player_id", p.id).order("sort"),
      c.from("player_media").select("id, kind, url, caption").eq("player_id", p.id).order("sort"),
    ]);
    const { id: _id, ...player } = p;
    return { player, stats: stats.data ?? [], milestones: milestones.data ?? [], media: media.data ?? [] };
  });
