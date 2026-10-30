import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const pushDb = supabaseAdmin as unknown as ReturnType<typeof createClient>;

type Audience = "public" | "admin";
type PushPayload = { title: string; body: string; url: string };

type StoredNotification = PushPayload & {
  id: string;
  audience: Audience;
  created_at: string;
};

function vapidConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
}

function configureVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function createNotification(
  payload: PushPayload,
  audience: Audience,
  createdBy?: string,
) {
  const { data, error } = await pushDb
    .from("notifications")
    .insert({ ...payload, audience, created_by: createdBy ?? null })
    .select("id, title, body, url, audience, created_at")
    .single();
  if (error || !data) throw new Error("Could not create notification");

  const notification = data as StoredNotification;
  const delivered = await deliverPush(notification);
  return { notification, delivered, pushConfigured: vapidConfigured() };
}

export async function deliverPush(notification: StoredNotification) {
  if (!configureVapid()) return 0;

  const { data: subscriptions, error } = await pushDb
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("audience", notification.audience)
    .is("disabled_at", null)
    .limit(500);
  if (error) throw new Error("Could not load push subscriptions");

  let delivered = 0;
  await Promise.all(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.url,
          }),
        );
        delivered += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await pushDb
            .from("push_subscriptions")
            .update({ disabled_at: new Date().toISOString() })
            .eq("id", subscription.id);
        }
      }
    }),
  );
  return delivered;
}

export async function notifyAdmins(payload: PushPayload) {
  try {
    await createNotification(payload, "admin");
  } catch (error) {
    console.error("[Push] Could not notify admins", error);
  }
}
