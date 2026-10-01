// NEXA · service worker: la app funciona sin conexión, también el mapa 3D
const CACHE_NAME = 'nexa-cache-v1';
const LIB_CACHE = 'nexa-lib-v1';
const FILES_TO_CACHE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './favicon.png', './apple-touch-icon.png'];
// librerías con versión fija: se guardan una vez y se sirven desde el móvil
const EX = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
  ...['shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'shaders/GammaCorrectionShader.js', 'postprocessing/EffectComposer.js', 'environments/RoomEnvironment.js', 'objects/Reflector.js', 'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js'].map(p => EX + p)];
const CDN = /^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then(c => c.addAll(FILES_TO_CACHE)),
    // las librerías se intentan guardar ya; si no hay conexión, se guardarán al usarlas
    caches.open(LIB_CACHE).then(c => Promise.all(LIBS.map(u => c.match(u).then(hit => hit || fetch(u, { mode: 'cors' }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})))))
  ]));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME && k !== LIB_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Tus archivos: red primero (siempre la última versión) y caché si no hay conexión
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // Librerías y tipografías: caché primero. Google/Firebase (tu nube) van siempre directos.
  if (CDN.test(url.hostname)) {
    e.respondWith(caches.open(LIB_CACHE).then(c => c.match(e.request, { ignoreVary: true }).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }))));
  }
});
