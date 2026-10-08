import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SplashSlide = { id: string; sort: number; kind: string; title: string | null; subtitle: string | null; image_path: string | null; image_url: string | null; bg_color: string; is_active: boolean };
export type NewsItem = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; category: string; author: string | null; is_featured: boolean; published: boolean; published_at: string | null; cover_path: string | null; cover_url: string | null };

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

/** Signs site-media paths for public display. Only called with paths from rows RLS already allowed. */
async function signPaths(paths: (string | null)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!list.length) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("site-media").createSignedUrls(list, 60 * 60 * 24 * 7);
  for (const r of data ?? []) if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
  return map;
}

const NEWS_COLS = "id, slug, title, excerpt, body, category, author, is_featured, published, published_at, cover_path";

export const getSplashSlides = createServerFn({ method: "GET" }).handler(async (): Promise<SplashSlide[]> => {
  const { data } = await publicClient().from("splash_slides").select("*").eq("is_active", true).order("sort").limit(3);
  const rows = data ?? [];
  const urls = await signPaths(rows.map((r) => r.image_path));
  return rows.map((r) => ({ ...r, image_url: r.image_path ? urls.get(r.image_path) ?? null : null }));
});

export const getNews = createServerFn({ method: "GET" }).handler(async (): Promise<NewsItem[]> => {
  const { data, error } = await publicClient().from("news_posts").select(NEWS_COLS).eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(60);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Omit<NewsItem, "cover_url">[];
  const urls = await signPaths(rows.map((r) => r.cover_path));
  return rows.map((r) => ({ ...r, cover_url: r.cover_path ? urls.get(r.cover_path) ?? null : null }));
});

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }): Promise<NewsItem | null> => {
    const { data: r } = await publicClient().from("news_posts").select(NEWS_COLS).eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!r) return null;
    const urls = await signPaths([r.cover_path]);
    return { ...(r as Omit<NewsItem, "cover_url">), cover_url: r.cover_path ? urls.get(r.cover_path) ?? null : null };
  });

/* ---------- Staff CMS ---------- */
async function requireAdmin(ctx: { supabase: { rpc: (f: "is_admin", a: { _user_id: string }) => PromiseLike<{ data: boolean | null }> }; userId: string }) {
  const { data } = await ctx.supabase.rpc("is_admin", { _user_id: ctx.userId });
  if (!data) throw new Error("Admin access required");
}

export const listContentAdmin = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context);
  const [s, n] = await Promise.all([
    context.supabase.from("splash_slides").select("*").order("sort"),
    context.supabase.from("news_posts").select(NEWS_COLS).order("published_at", { ascending: false, nullsFirst: true }),
  ]);
  const slides = s.data ?? []; const news = (n.data ?? []) as Omit<NewsItem, "cover_url">[];
  const urls = await signPaths([...slides.map((x) => x.image_path), ...news.map((x) => x.cover_path)]);
  return {
    slides: slides.map((x) => ({ ...x, image_url: x.image_path ? urls.get(x.image_path) ?? null : null })) as SplashSlide[],
    news: news.map((x) => ({ ...x, cover_url: x.cover_path ? urls.get(x.cover_path) ?? null : null })) as NewsItem[],
  };
});

const opt = (max: number) => z.string().trim().max(max).nullable().optional().transform((v) => v || null);
const path = z.string().max(300).regex(/^(splash|news)\/[A-Za-z0-9._\-/]+$/).nullable().optional().transform((v) => v || null);

export const saveSlide = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(), sort: z.number().int().min(0).max(99),
    kind: z.enum(["crest", "image", "text", "image_text"]), title: opt(120), subtitle: opt(300), image_path: path,
    bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/), is_active: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...row } = data;
    const r = id ? await context.supabase.from("splash_slides").update(row).eq("id", id) : await context.supabase.from("splash_slides").insert(row);
    if (r.error) throw new Error("Could not save slide");
    return { ok: true };
  });

export const deleteSlide = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("splash_slides").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete slide");
    return { ok: true };
  });

export const saveNews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(), title: z.string().trim().min(3).max(200),
    slug: z.string().trim().max(200).regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes").optional(),
    excerpt: opt(400), body: opt(20000), category: z.string().trim().min(2).max(40), author: opt(80),
    cover_path: path, is_featured: z.boolean(), published: z.boolean(), published_at: z.string().max(40).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...rest } = data;
    const slug = rest.slug || rest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) + "-" + Date.now().toString(36).slice(-4);
    const row = { ...rest, slug, published_at: rest.published ? rest.published_at || new Date().toISOString() : rest.published_at || null };
    if (row.is_featured) await context.supabase.from("news_posts").update({ is_featured: false }).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    const r = id ? await context.supabase.from("news_posts").update(row).eq("id", id) : await context.supabase.from("news_posts").insert(row);
    if (r.error) throw new Error(r.error.code === "23505" ? "That web address is already used" : "Could not save article");
    return { ok: true };
  });

export const deleteNews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("news_posts").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete article");
    return { ok: true };
  });
