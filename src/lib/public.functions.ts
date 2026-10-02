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
