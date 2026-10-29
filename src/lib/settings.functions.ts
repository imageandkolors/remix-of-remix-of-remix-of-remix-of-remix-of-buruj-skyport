import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteSettings = {
  whatsapp: string;
  email: string;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  x_url: string | null;
  youtube: string | null;
  header_bg: string;
  header_fg: string;
  footer_bg: string;
  footer_fg: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: "2348000000000",
  email: "info@burujsportsacademy.com",
  phone: null,
  facebook: null,
  instagram: null,
  tiktok: null,
  x_url: null,
  youtube: null,
  header_bg: "#0b1f3a",
  header_fg: "#ffffff",
  footer_bg: "#0b1f3a",
  footer_fg: "#ffffff",
};

const COLS =
  "whatsapp, email, phone, facebook, instagram, tiktok, x_url, youtube, header_bg, header_fg, footer_bg, footer_fg";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const c = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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
    const { data } = await c.from("site_settings").select(COLS).eq("id", 1).maybeSingle();
    return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as SiteSettings;
  },
);

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #0b1f3a");
const link = z
  .string()
  .trim()
  .max(300)
  .url("Enter a full web address")
  .or(z.literal(""))
  .transform((v) => v || null);

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        whatsapp: z
          .string()
          .trim()
          .regex(/^\+?[0-9 ]{7,20}$/, "WhatsApp must be digits, e.g. 2348012345678")
          .transform((v) => v.replace(/[^0-9]/g, "")),
        email: z.string().trim().email().max(255),
        phone: z
          .string()
          .trim()
          .max(30)
          .transform((v) => v || null),
        facebook: link,
        instagram: link,
        tiktok: link,
        x_url: link,
        youtube: link,
        header_bg: hex,
        header_fg: hex,
        footer_bg: hex,
        footer_fg: hex,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    if (!isAdmin) throw new Error("Admin access required");
    const { error } = await context.supabase
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error("Could not save settings");
    return { ok: true };
  });
