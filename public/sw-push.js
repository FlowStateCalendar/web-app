/* global self */
self.addEventListener("push", (event) => {
  let payload = { title: "Shift Habits", body: "", url: "/" };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    try {
      const t = event.data?.text();
      if (t) payload = JSON.parse(t);
    } catch {
      /* ignore */
    }
  }
  const title = payload.title ?? "Shift Habits";
  const body = payload.body ?? "";
  const url = payload.url ?? "/";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      tag: payload.tag ?? "shifthabits-reminder",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
