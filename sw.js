/* Saba Deck の Service Worker。
   電波がないとき・弱いときにも前回の画面を出すため、画面の部品を手元に残す。
   いつもネットを先に見るので、新しい版はふつうに読まれる。
   version.json と裏方（Apps Script）は残さない（古い情報を出さないため）。
   データと音声は app.js が IndexedDB に残している。 */
const CACHE = "saba-deck-v1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "vendor/qrcode.min.js"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (same && /version\.json$/.test(url.pathname)) return;          // 版の確認はいつもネット
  if (same && /demo\.js$/.test(url.pathname)) return;               // デモ用は残さない
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;           // 裏方・QR の部品などは触らない

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // 画面を開くとき（?c=… が付く）は、アドレスの ? 以降を無視して index.html として残す
    const key = req.mode === "navigate" ? new Request(new URL("index.html", self.registration.scope).href) : req;
    // 同じサイトの部品は HTTP キャッシュ（GitHub Pages は10分）を通さず確かめる。変わっていなければ 304 で軽い
    const net = fetch(req, same ? { cache: "no-cache" } : undefined).then((res) => {
      // 中身の見えない応答（opaque）は、失敗でも成功に見えるので残さない
      if (res && res.ok && res.type !== "opaque") e.waitUntil(cache.put(key, res.clone()).catch(() => {}));
      return res;
    });
    net.catch(() => {});
    try {
      // 画面を開くときは、5秒たっても返事がなければ手元の画面を出す（弱い電波で真っ白のまま待たない）
      if (req.mode === "navigate") {
        const hit = await cache.match(key, { ignoreSearch: true });
        if (hit) return await Promise.race([net, new Promise((ok) => setTimeout(() => ok(hit), 5000))]);
      }
      return await net;
    } catch (err) {
      const hit = await cache.match(key, { ignoreSearch: same });   // 部品の ?v= が違っても、つながらないときは手元のものを出す
      if (hit) return hit;
      throw err;
    }
  })());
});
