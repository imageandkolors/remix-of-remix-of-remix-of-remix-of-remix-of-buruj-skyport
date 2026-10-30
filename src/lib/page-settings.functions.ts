/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { httpError } from "@/lib/http-error";

export type ContactLocation = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  map_url: string | null;
  sort: number;
  is_active: boolean;
};
export type ContactPage = { heading: string; intro: string; locations: ContactLocation[] };
export type PageSeo = {
  id: string;
  page_key: string;
  page_path: string;
  title: string;
  description: string;
  keywords: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_path: string | null;
  og_image_url: string | null;
  og_type: string;
  twitter_card: string;
  robots: string;
};

function client() {
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
async function admin(context: any) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw httpError(403, "Admin access required");
}
async function sign(path: string | null) {
  if (!path) return null;
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    return process.env["SUPABASE_URL"]
      ? `${process.env["SUPABASE_URL"]}/storage/v1/object/public/site-media/${path}`
      : null;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("site-media")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export const getContactPage = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactPage> => {
    const c = client();
    const [settings, locations] = await Promise.all([
      (c as any)
        .from("site_settings")
        .select("contact_heading,contact_intro")
        .eq("id", 1)
        .maybeSingle(),
      (c as any)
        .from("contact_locations")
        .select("id,name,address,phone,email,whatsapp,map_url,sort,is_active")
        .eq("is_active", true)
        .order("sort")
        .limit(20),
    ]);
    return {
      heading: settings.data?.contact_heading || "Come and see Buruj",
      intro:
        settings.data?.contact_intro ||
        "Visit the campus, chat with us on WhatsApp, or send an enquiry — no account needed.",
      locations: locations.data ?? [],
    };
  },
);
export const listContactAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await admin(context);
    const [settings, locations] = await Promise.all([
      (context.supabase as any)
        .from("site_settings")
        .select("contact_heading,contact_intro")
        .eq("id", 1)
        .maybeSingle(),
      (context.supabase as any).from("contact_locations").select("*").order("sort"),
    ]);
    return {
      heading: settings.data?.contact_heading || "Come and see Buruj",
      intro: settings.data?.contact_intro || "",
      locations: locations.data ?? [],
    };
  });
export const saveContactPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        heading: z.string().trim().min(2).max(160),
        intro: z.string().trim().min(2).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await admin(context);
    const { error } = await (context.supabase as any)
      .from("site_settings")
      .update({
        contact_heading: data.heading,
        contact_intro: data.intro,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw new Error("Could not save contact copy");
    return { ok: true };
  });
export const saveContactLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        address: z.string().trim().min(5).max(300),
        phone: z.string().trim().max(40).nullable().optional(),
        email: z.string().email().nullable().optional().or(z.literal("")),
        whatsapp: z.string().trim().max(40).nullable().optional(),
        map_url: z.string().url().nullable().optional().or(z.literal("")),
        sort: z.number().int().min(0).max(999),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await admin(context);
    const { id, ...rest } = data;
    const row = {
      ...rest,
      phone: rest.phone || null,
      email: rest.email || null,
      whatsapp: rest.whatsapp || null,
      map_url: rest.map_url || null,
      updated_at: new Date().toISOString(),
    };
    const result = id
      ? await (context.supabase as any).from("contact_locations").update(row).eq("id", id)
      : await (context.supabase as any).from("contact_locations").insert(row);
    if (result.error) throw new Error(result.error.message || "Could not save office");
    return { ok: true };
  });
export const deleteContactLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await admin(context);
    const { error } = await (context.supabase as any)
      .from("contact_locations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Could not delete office");
    return { ok: true };
  });

export const getPageSeo = createServerFn({ method: "GET" })
  .inputValidator((d: { page_key: string }) => ({ page_key: String(d.page_key).slice(0, 80) }))
  .handler(async ({ data }): Promise<PageSeo | null> => {
    const { data: row, error } = await (client() as any)
      .from("page_seo")
      .select("*")
      .eq("page_key", data.page_key)
      .maybeSingle();
    if (error || !row) return null;
    return { ...row, og_image_url: await sign(row.og_image_path) };
  });
export const listPageSeoAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PageSeo[]> => {
    await admin(context);
    const { data, error } = await (context.supabase as any)
      .from("page_seo")
      .select("*")
      .order("page_path");
    if (error) throw new Error(error.message);
    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        ...row,
        og_image_url: await sign(row.og_image_path),
      })),
    );
  });
export const savePageSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(2).max(200),
        description: z.string().trim().max(300),
        keywords: z.string().trim().max(500).nullable().optional(),
        canonical_url: z.string().url().nullable().optional().or(z.literal("")),
        og_title: z.string().trim().max(200).nullable().optional(),
        og_description: z.string().trim().max(300).nullable().optional(),
        og_image_path: z
          .string()
          .max(300)
          .regex(/^social\/[A-Za-z0-9._\-/]+$/)
          .nullable()
          .optional(),
        og_type: z.enum(["website", "article", "profile"]),
        twitter_card: z.enum(["summary", "summary_large_image"]),
        robots: z.string().trim().max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await admin(context);
    const { id, ...rest } = data;
    const { error } = await (context.supabase as any)
      .from("page_seo")
      .update({
        ...rest,
        keywords: rest.keywords || null,
        canonical_url: rest.canonical_url || null,
        og_title: rest.og_title || null,
        og_description: rest.og_description || null,
        og_image_path: rest.og_image_path || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message || "Could not save SEO metadata");
    return { ok: true };
  });
