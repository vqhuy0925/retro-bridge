import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * `npm run dev` runs plain Vite — it knows nothing about the Vercel
 * serverless functions in api/. This middleware emulates that one route
 * locally (dev-only; `configureServer` never runs during `vite build`,
 * so production on Vercel is unaffected) by loading the real handler
 * through Vite's SSR module pipeline and calling it with a minimal
 * req/res shim.
 */
function localApiMiddleware(): Plugin {
  return {
    name: 'local-api-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/extract-notes', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
        });
        req.on('end', () => {
          (async () => {
            const body = raw ? JSON.parse(raw) : {};
            const mod = await server.ssrLoadModule('/api/extract-notes.ts');
            const handler = mod.default as (
              req: { method?: string; body: unknown },
              res: { status: (code: number) => { json: (payload: unknown) => void } },
            ) => Promise<void>;

            const fakeRes = {
              status(code: number) {
                res.statusCode = code;
                return {
                  json(payload: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(payload));
                  },
                };
              },
            };
            await handler({ method: 'POST', body }, fakeRes);
          })().catch((err) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          });
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env.local (and friends) so server-only vars like GEMINI_API_KEY —
  // deliberately NOT VITE_-prefixed, so they never reach the client bundle —
  // are available to the dev-only API middleware above via process.env.
  // Note: assigning `undefined` to a process.env property coerces it to
  // the literal string "undefined" — only assign when there's a real value.
  const env = loadEnv(mode, process.cwd(), '');
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (!process.env.GEMINI_MODEL && env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;

  return {
    plugins: [
      react(),
      localApiMiddleware(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
        manifest: {
          id: '/',
          name: 'Retro Bridge',
          short_name: 'Retro Bridge',
          description:
            "A lightweight sprint retro tool that syncs your team's physical sticky-note board with a remote PO in real time.",
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#eef2ef',
          theme_color: '#0e6b57',
          categories: ['productivity', 'business'],
          icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // The board photo capture + note extraction endpoint must always
              // hit the network — caching a response here would mean a stale
              // or wrong extraction result the next time it's called offline.
              urlPattern: /\/api\/extract-notes/,
              handler: 'NetworkOnly',
            },
            {
              // Never serve stale retro data from cache — this app's whole
              // point is a live-synced board, not an offline snapshot.
              urlPattern: /^https:\/\/(?:.*\.firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com)/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/css2/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 3000,
    },
  };
});
