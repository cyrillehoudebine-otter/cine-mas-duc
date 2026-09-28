// Ciné Mas Duc — mise en cache pour ouverture rapide et hors connexion
const CACHE = 'cine-mas-duc-v1';
const COQUILLE = ['./', 'index.html', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Base Supabase et API TMDB : toujours en direct
  if (u.hostname.endsWith('supabase.co') || u.hostname === 'api.themoviedb.org') return;
  // Appli, polices, bibliothèque, affiches : cache puis mise à jour en arrière-plan
  const local = u.origin === location.origin;
  const externe = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'image.tmdb.org'].includes(u.hostname);
  if (!local && !externe) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await c.match(e.request);
    const reseau = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => enCache);
    return enCache || reseau;
  }));
});
