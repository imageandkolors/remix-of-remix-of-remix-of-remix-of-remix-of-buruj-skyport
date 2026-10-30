self.addEventListener("push", (event) => {
  let payload = {
    title: "Buruj Sports Academy",
    body: "You have a new Buruj update.",
    url: "/",
  };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Keep the safe fallback payload when a provider sends invalid JSON.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "buruj-update",
      renotify: true,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
