import {
  getPushConfig,
  saveAdminPushSubscription,
  savePublicPushSubscription,
} from "@/lib/notifications.functions";

function decodeBase64Url(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value.replace(/-/g, "+").replace(/_/g, "/")}${padding}`;
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function subscribeToPush(audience: "public" | "admin") {
  if (!isPushSupported()) throw new Error("Push notifications are not supported on this device");

  const { publicKey } = await getPushConfig();
  if (!publicKey) throw new Error("Push notifications are not configured yet");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted");

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    }));
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("The device returned an incomplete push subscription");
  }

  const payload = {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
  if (audience === "admin") {
    await saveAdminPushSubscription({ data: payload });
  } else {
    await savePublicPushSubscription({ data: payload });
  }
  return subscription;
}
