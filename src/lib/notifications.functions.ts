import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { httpError } from "@/lib/http-error";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(10).max(200),
  }),
});

const notificationSchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(240),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value.startsWith("/"), "Notification URLs must be site-relative"),
  audience: z.enum(["public", "admin"]),
});

type StaffContext = { supabase: SupabaseClient<Database>; userId: string };

async function requireStaff(context: StaffContext) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error) throw new Error("Could not verify staff access");
  if (!data) throw httpError(403, "Staff access required");
}

export const getPushConfig = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
}));

export const savePublicPushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d) => subscriptionSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;
    const { error } = await db.from("push_subscriptions").upsert(
      {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        audience: "public",
        user_id: null,
        user_agent: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error("Could not save push subscription");
    return { ok: true };
  });

export const saveAdminPushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => subscriptionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;
    const { error } = await db.from("push_subscriptions").upsert(
      {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        audience: "admin",
        user_id: context.userId,
        user_agent: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error("Could not save admin push subscription");
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ endpoint: z.string().url().max(2048) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;
    const { error } = await db
      .from("push_subscriptions")
      .update({ disabled_at: new Date().toISOString() })
      .eq("endpoint", data.endpoint);
    if (error) throw new Error("Could not remove push subscription");
    return { ok: true };
  });

export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => notificationSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context);
    const { createNotification } = await import("@/lib/push.server");
    return createNotification(data, data.audience, context.userId);
  });

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;
    const { data, error } = await db
      .from("notifications")
      .select("id, title, body, url, audience, created_at")
      .eq("audience", "admin")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load notifications");
    return data ?? [];
  });
