/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SplashSlide = {
  id: string;
  sort: number;
  kind: string;
  title: string | null;
  subtitle: string | null;
  image_path: string | null;
  image_url: string | null;
  video_path?: string | null;
  video_url?: string | null;
  youtube_url?: string | null;
  media_kind?: string;
  alt_text?: string | null;
  link_url?: string | null;
  bg_color: string;
  is_active: boolean;
  created_at: string | null;
};
export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  body_html?: string | null;
  category: string;
  tags?: string[];
  seo_keywords?: string | null;
  author: string | null;
  is_featured: boolean;
  published: boolean;
  published_at: string | null;
  cover_path: string | null;
  cover_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  social_image_path: string | null;
  social_image_url: string | null;
  seo_author: string | null;
  article_section: string | null;
  schema_publisher: string | null;
};
export type SocialFeed = {
  id: string;
  platform: "youtube" | "instagram" | "facebook";
  label: string;
  source_url: string;
  is_active: boolean;
  display_limit: number;
  sort: number;
};
export type GalleryMedia = {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  kind: "image" | "video" | "youtube";
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  sort: number;
  is_active: boolean;
  media_url: string | null;
  created_at: string;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function signPaths(paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (!list.length) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("site-media")
    .createSignedUrls(list, 60 * 60 * 24 * 7);
  for (const r of data ?? []) if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
  return map;
}

async function hydrateHtml(html: string | null | undefined) {
  if (!html) return html ?? null;
  const paths = [...html.matchAll(/data-storage-path=["']([^"']+)["']/g)].map((m) => m[1]);
  const urls = await signPaths(paths);
  return html.replace(/data-storage-path=["']([^"']+)["']/g, (full, path) => {
    const url = urls.get(path);
    return url ? `src="${url}" data-storage-path="${path}"` : full;
  });
}

const NEWS_COLS =
  "id, slug, title, excerpt, body, body_html, category, tags, seo_keywords, author, is_featured, published, published_at, cover_path, meta_title, meta_description, canonical_url, social_image_path, seo_author, article_section, schema_publisher";
const pathSchema = z
  .string()
  .max(300)
  .regex(/^(splash|news|social|about)\/[A-Za-z0-9._\-/]+$/)
  .nullable()
  .optional()
  .transform((v) => v || null);
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);

export const getSplashSlides = createServerFn({ method: "GET" }).handler(
  async (): Promise<SplashSlide[]> => {
    const { data } = await (publicClient() as any)
      .from("splash_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort")
      .limit(8);
    const rows = data ?? [];
    const urls = await signPaths(rows.flatMap((r: any) => [r.image_path, r.video_path]));
    return rows.map((r: any) => ({
      ...r,
      image_url: r.image_path ? (urls.get(r.image_path) ?? null) : null,
      video_url: r.video_path ? (urls.get(r.video_path) ?? null) : null,
    }));
  },
);

async function hydrateNews(rows: any[]): Promise<NewsItem[]> {
  const urls = await signPaths(rows.flatMap((r) => [r.cover_path, r.social_image_path]));
  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      body_html: await hydrateHtml(r.body_html),
      cover_url: r.cover_path ? (urls.get(r.cover_path) ?? null) : null,
      social_image_url: r.social_image_path ? (urls.get(r.social_image_path) ?? null) : null,
    })),
  );
}

export const getNews = createServerFn({ method: "GET" }).handler(async (): Promise<NewsItem[]> => {
  const { data, error } = await (publicClient() as any)
    .from("news_posts")
    .select(NEWS_COLS)
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return hydrateNews(data ?? []);
});

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }): Promise<NewsItem | null> => {
    const { data: r } = await (publicClient() as any)
      .from("news_posts")
      .select(NEWS_COLS)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!r) return null;
    return (await hydrateNews([r]))[0] ?? null;
  });

async function requireAdmin(ctx: {
  supabase: {
    rpc: (f: "is_admin", a: { _user_id: string }) => PromiseLike<{ data: boolean | null }>;
  };
  userId: string;
}) {
  const { data } = await ctx.supabase.rpc("is_admin", { _user_id: ctx.userId });
  if (!data) throw new Error("Admin access required");
}

export const listContentAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [s, n, c, f, t, g] = await Promise.all([
      (context.supabase as any).from("splash_slides").select("*").order("sort"),
      (context.supabase as any)
        .from("news_posts")
        .select(NEWS_COLS)
        .order("published_at", { ascending: false, nullsFirst: true }),
      (context.supabase as any)
        .from("content_categories")
        .select("id,name,slug,sort,is_active")
        .order("sort"),
      (context.supabase as any)
        .from("social_feeds")
        .select("id,platform,label,source_url,is_active,display_limit,sort")
        .order("sort"),
      (context.supabase as any).from("content_tags").select("id,name,slug").order("name"),
      (context.supabase as any)
        .from("gallery_media")
        .select("*")
        .order("sort")
        .order("created_at", { ascending: false }),
    ]);
    const slides = s.data ?? [];
    const news = await hydrateNews(n.data ?? []);
    const urls = await signPaths(slides.flatMap((x: any) => [x.image_path, x.video_path]));
    return {
      slides: slides.map((x: any) => ({
        ...x,
        image_url: x.image_path ? (urls.get(x.image_path) ?? null) : null,
        video_url: x.video_path ? (urls.get(x.video_path) ?? null) : null,
      })),
      news,
      categories: c.data ?? [],
      feeds: f.data ?? [],
      tags: t.data ?? [],
      gallery: await hydrateGallery(g.data ?? []),
    };
  });

async function hydrateGallery(rows: any[]): Promise<GalleryMedia[]> {
  const urls = await signPaths(rows.map((row) => row.storage_path));
  return rows.map((row) => ({
    ...row,
    media_url: row.storage_path ? (urls.get(row.storage_path) ?? null) : row.external_url,
  }));
}

export const getGalleryMedia = createServerFn({ method: "GET" }).handler(
  async (): Promise<GalleryMedia[]> => {
    const { data, error } = await (publicClient() as any)
      .from("gallery_media")
      .select("*")
      .eq("is_active", true)
      .order("sort")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return hydrateGallery(data ?? []);
  },
);

export const requestCmsUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        filename: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().min(3).max(120),
        size: z
          .number()
          .int()
          .positive()
          .max(150 * 1024 * 1024),
        purpose: z.enum(["news", "social", "splash", "about"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const valid = data.mimeType.startsWith("image/") || data.mimeType.startsWith("video/");
    if (!valid) throw new Error("Only image and video files are supported");
    if (data.mimeType.startsWith("video/") && data.size > 100 * 1024 * 1024)
      throw new Error("Videos must be under 100 MB");
    if (data.mimeType.startsWith("image/") && data.size > 20 * 1024 * 1024)
      throw new Error("Images must be under 20 MB");
    const safe = data.filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(-100);
    const path = `${data.purpose}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("site-media")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare media upload");
    return { bucket: "site-media", path, token: signed.token };
  });

export const saveSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        sort: z.number().int().min(0).max(99),
        kind: z.enum(["crest", "image", "text", "image_text"]),
        media_kind: z.enum(["image", "video", "youtube", "none"]).default("image"),
        title: opt(120),
        subtitle: opt(300),
        image_path: pathSchema,
        video_path: pathSchema,
        youtube_url: opt(500),
        alt_text: opt(180),
        link_url: opt(500),
        bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...row } = data;
    const r = id
      ? await (context.supabase as any).from("splash_slides").update(row).eq("id", id)
      : await (context.supabase as any).from("splash_slides").insert(row);
    if (r.error) throw new Error("Could not save slide");
    return { ok: true };
  });

export const deleteSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await (context.supabase as any)
      .from("splash_slides")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Could not delete slide");
    return { ok: true };
  });

const cleanHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 100000);
const safeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const saveNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(3).max(200),
        slug: z
          .string()
          .trim()
          .max(200)
          .regex(/^[a-z0-9-]*$/)
          .optional(),
        excerpt: opt(400),
        body: opt(20000),
        body_html: z.string().max(100000).optional(),
        category: z.string().trim().min(2).max(80),
        tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
        seo_keywords: opt(500),
        author: opt(80),
        cover_path: pathSchema,
        social_image_path: pathSchema,
        is_featured: z.boolean(),
        published: z.boolean(),
        published_at: z.string().max(40).nullable().optional(),
        meta_title: opt(80),
        meta_description: opt(180),
        canonical_url: opt(500),
        seo_author: opt(80),
        article_section: opt(80),
        schema_publisher: opt(80),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...rest } = data;
    const slug = rest.slug || `${safeSlug(rest.title)}-${Date.now().toString(36).slice(-4)}`;
    const row = {
      ...rest,
      slug,
      body_html: rest.body_html ? cleanHtml(rest.body_html) : null,
      published_at: rest.published
        ? rest.published_at || new Date().toISOString()
        : rest.published_at || null,
      meta_title: rest.meta_title || null,
      meta_description: rest.meta_description || null,
      canonical_url: rest.canonical_url || null,
      social_image_path: rest.social_image_path || null,
      seo_author: rest.seo_author || rest.author || null,
      article_section: rest.article_section || rest.category || null,
      schema_publisher: rest.schema_publisher || "Buruj Sports Academy",
    };
    if (row.is_featured)
      await (context.supabase as any)
        .from("news_posts")
        .update({ is_featured: false })
        .neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    const r = id
      ? await (context.supabase as any).from("news_posts").update(row).eq("id", id)
      : await (context.supabase as any).from("news_posts").insert(row);
    if (r.error)
      throw new Error(
        r.error.code === "23505"
          ? "That web address is already used"
          : r.error.message || "Could not save article",
      );
    const normalizedTags = [...new Set((rest.tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
    if (normalizedTags.length) {
      await (context.supabase as any).from("content_tags").upsert(
        normalizedTags.map((name) => ({ name, slug: safeSlug(name) })),
        { onConflict: "slug" },
      );
    }
    return { ok: true };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await (context.supabase as any).from("news_posts").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete article");
    return { ok: true };
  });

export const saveSocialFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        platform: z.enum(["youtube", "instagram", "facebook"]),
        label: z.string().trim().min(2).max(80),
        source_url: z.string().url().max(500),
        is_active: z.boolean(),
        display_limit: z.number().int().min(1).max(24),
        sort: z.number().int().min(0).max(99),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...row } = data;
    const r = id
      ? await (context.supabase as any).from("social_feeds").update(row).eq("id", id)
      : await (context.supabase as any).from("social_feeds").insert(row);
    if (r.error) throw new Error("Could not save feed");
    return { ok: true };
  });

export const getSocialFeeds = createServerFn({ method: "GET" }).handler(
  async (): Promise<SocialFeed[]> => {
    const { data } = await (publicClient() as any)
      .from("social_feeds")
      .select("id,platform,label,source_url,is_active,display_limit,sort")
      .eq("is_active", true)
      .order("sort")
      .limit(12);
    return data ?? [];
  },
);

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ name: z.string().trim().min(2).max(80), description: opt(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const name = data.name.trim();
    const { error } = await (context.supabase as any)
      .from("content_categories")
      .insert({ name, slug: safeSlug(name), description: data.description, is_active: true });
    if (error)
      throw new Error(
        error.code === "23505" ? "That category already exists" : "Could not create category",
      );
    return { ok: true };
  });

export const saveTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const name = data.name.trim();
    const { error } = await (context.supabase as any)
      .from("content_tags")
      .insert({ name, slug: safeSlug(name) });
    if (error)
      throw new Error(error.code === "23505" ? "That tag already exists" : "Could not create tag");
    return { ok: true };
  });

export const saveGalleryMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(160),
        caption: opt(500),
        category: z.string().trim().min(2).max(80),
        kind: z.enum(["image", "video", "youtube"]),
        storage_path: pathSchema,
        external_url: z.string().url().max(500).nullable().optional(),
        mime_type: opt(120),
        sort: z.number().int().min(0).max(999),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.kind === "youtube" && (!data.external_url || data.storage_path))
      throw new Error("YouTube media needs a YouTube URL only");
    if (data.kind !== "youtube" && (!data.storage_path || data.external_url))
      throw new Error("Local image and video media needs an uploaded file only");
    const { id, ...row } = data;
    const result = id
      ? await (context.supabase as any).from("gallery_media").update(row).eq("id", id)
      : await (context.supabase as any).from("gallery_media").insert(row);
    if (result.error) throw new Error(result.error.message || "Could not save gallery media");
    return { ok: true };
  });

export const deleteGalleryMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await (context.supabase as any)
      .from("gallery_media")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Could not delete gallery media");
    return { ok: true };
  });
