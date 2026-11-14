// Nissemor-guiden service worker, scope /nissemor-guide/.
// Caches only hashed static assets and the offline page. Pages and /api/*
// always go to the network and are never stored: they hold codes and verdicts.
const CACHE = "nissemor-v1";
const OFFLINE = "/nissemor-guide/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([OFFLINE, "/nissemor-guide/ikon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone());
              return res;
            }),
        ),
      ),
    );
  }
  // Everything else (/api/*, /media/*): network only, no respondWith.
});

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {}
  e.waitUntil(
    self.registration.showNotification(d.title || "Nissemor-guiden", {
      body: d.body || "",
      tag: d.tag,
      icon: "/nissemor-guide/ikon-192.png",
      data: { url: d.url || "/nissemor-guide/i-dag" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const u = e.notification.data && e.notification.data.url;
  const url =
    typeof u === "string" && u.startsWith("/nissemor-guide")
      ? u
      : "/nissemor-guide/i-dag";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((ws) => {
      const w = ws.find((c) => "focus" in c);
      return w
        ? w.navigate(url).then((c) => (c || w).focus())
        : self.clients.openWindow(url);
    }),
  );
});
