// NEXA 4 · funciona sin conexión. Todo se sirve desde el propio sitio; Google (tu nube) va siempre directo.
const CACHE = 'nexa-app-v4', LIBS = 'nexa-lib-v4';
const FILES = ['./', './index.html', './manifest.json', './privacidad.html', './aviso-legal.html', './favicon.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
const LIB = ["./lib/CopyShader.js", "./lib/EffectComposer.js", "./lib/LuminosityHighPassShader.js", "./lib/Reflector.js", "./lib/RenderPass.js", "./lib/ShaderPass.js", "./lib/UnrealBloomPass.js", "./lib/three.min.js", "./fonts/rajdhani-Medium.woff", "./fonts/rajdhani-SemiBold.woff", "./fonts/rajdhani-Bold.woff"];
self.addEventListener('install', e => { e.waitUntil(Promise.all([caches.open(CACHE).then(c => c.addAll(FILES)), caches.open(LIBS).then(c => c.addAll(LIB))])); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('nexa-') && k !== CACHE && k !== LIBS).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return; const url = new URL(e.request.url); if (url.origin !== location.origin) return;
  if (/\/(lib|fonts)\//.test(url.pathname)) { e.respondWith(caches.open(LIBS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })))); return; }
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
