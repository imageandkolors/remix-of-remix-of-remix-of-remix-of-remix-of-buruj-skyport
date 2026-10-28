/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AboutSection = {
  id: string;
  section_key: string;
  sort: number;
  layout: "hero" | "content" | "split" | "cards" | "cta";
  eyebrow: string | null;
  title: string;
  body_html: string;
  image_path: string | null;
  image_alt: string | null;
  image_url: string | null;
  bg_color: string;
  text_color: string;
  accent_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
async function signImages(paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!list.length) return map;
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    const base = process.env["SUPABASE_URL"];
    if (base)
      for (const path of list) map.set(path, `${base}/storage/v1/object/public/site-media/${path}`);
    return map;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("site-media")
    .createSignedUrls(list, 60 * 60 * 24 * 7);
  for (const row of data ?? []) if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  return map;
}
const cleanHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 100000);
const path = z
  .string()
  .max(300)
  .regex(/^about\/[A-Za-z0-9._\-/]+$/)
  .nullable()
  .optional()
  .transform((v) => v || null);

async function hydrate(rows: any[]): Promise<AboutSection[]> {
  const urls = await signImages(rows.map((row) => row.image_path));
  return rows.map((row) => ({
    ...row,
    image_url: row.image_path ? (urls.get(row.image_path) ?? null) : null,
  }));
}

export const getAboutSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<AboutSection[]> => {
    const { data, error } = await (publicClient() as any)
      .from("about_sections")
      .select("*")
      .eq("is_active", true)
      .order("sort")
      .limit(30);
    if (error) throw new Error(error.message);
    return hydrate(data ?? []);
  },
);

async function requireAdmin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Admin access required");
}

export const listAboutAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("about_sections")
      .select("*")
      .order("sort");
    if (error) throw new Error(error.message);
    return hydrate(data ?? []);
  });

export const saveAboutSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        section_key: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9-]+$/),
        sort: z.number().int().min(0).max(999),
        layout: z.enum(["hero", "content", "split", "cards", "cta"]),
        eyebrow: z.string().trim().max(120).nullable().optional(),
        title: z.string().trim().min(2).max(180),
        body_html: z.string().max(100000),
        image_path: path,
        image_alt: z.string().trim().max(180).nullable().optional(),
        bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...rest } = data;
    const row = {
      ...rest,
      body_html: cleanHtml(rest.body_html),
      updated_at: new Date().toISOString(),
    };
    const result = id
      ? await (context.supabase as any).from("about_sections").update(row).eq("id", id)
      : await (context.supabase as any).from("about_sections").insert(row);
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "That section key already exists"
          : result.error.message || "Could not save About section",
      );
    return { ok: true };
  });

export const deleteAboutSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await (context.supabase as any)
      .from("about_sections")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Could not delete About section");
    return { ok: true };
  });
