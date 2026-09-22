import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react(), localApiMiddleware()],
    server: {
      port: 3000,
    },
  };
});
