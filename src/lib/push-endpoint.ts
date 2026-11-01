const PUSH_SERVICE_HOSTS = new Set([
  "fcm.googleapis.com",
  "web.push.apple.com",
  "push.services.mozilla.com",
]);

export function isTrustedPushEndpoint(value: string): boolean {
  try {
    const endpoint = new URL(value);
    const hostname = endpoint.hostname.toLowerCase().replace(/\.$/, "");
    const trustedHost =
      PUSH_SERVICE_HOSTS.has(hostname) ||
      hostname.endsWith(".push.apple.com") ||
      hostname.endsWith(".push.services.mozilla.com");
    return (
      endpoint.protocol === "https:" &&
      !endpoint.username &&
      !endpoint.password &&
      !endpoint.port &&
      trustedHost
    );
  } catch {
    return false;
  }
}

export function isSafeNotificationPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  try {
    return new URL(value, "https://buruj.invalid").origin === "https://buruj.invalid";
  } catch {
    return false;
  }
}
