# Nutrition Dashboard

Personal mobile dashboard: pulls meals from the Notion "Питание" (Nutrition) database and
shows how much has been eaten per day/period and **how much more to eat** to reach daily
minimums (calories, protein, fiber). The framing is "sufficiency" — no caps, no deficits.

- **Stack:** Vite + React + TypeScript + Tailwind v4 + shadcn/ui (Base UI) + recharts.
- **Hosting:** Cloudflare Workers — static assets (Static Assets) + Worker at `/api/nutrition` as a proxy to Notion.
- **Access:** Secured via Cloudflare Access (Zero Trust).
- Regular online SPA (no service worker). "Installation" = adding a shortcut from the browser to the home screen.

## How it works

```
Browser (SPA)  ──GET /api/nutrition?since=YYYY-MM-DD──▶  Worker  ──▶  Notion API
   renders rings/cards/charts          keeps NOTION_TOKEN in env, calls Notion
```

The frontend and Worker share a **single origin**, so no CORS is needed and the token never
reaches the browser. On load, a **single** request fetches 7 days of data
(`since = today − 6`), while switching between Today / 2 / 3 / 7 days is computed on the
client — instantly, without new requests.

## Environment variables

Only one variable is needed — **`NOTION_TOKEN`**: a Notion internal integration secret with
**read-only** access. The "Питание" database is already shared with the integration.

- **Locally:** copy `.dev.vars.example` → `.dev.vars` and paste the token.
  `.dev.vars` is in `.gitignore` — it won't end up in the repository.
- **Production:** set as a Worker secret (see "Deploy"). The token must never appear in code or git.

In addition to the secret, `wrangler.jsonc` has non-secret `vars` for validating the
Cloudflare Access token — `ACCESS_JWKS_URL` and `ACCESS_AUD` (see "Access"). These can be committed.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # and paste NOTION_TOKEN
npm run dev
```

`npm run dev` starts two processes in parallel:

- **Vite** (`http://localhost:5173`) — the dashboard itself with HMR;
- **`wrangler dev --port 8788`** — Worker locally (handles `/api/*`).

Vite proxies `/api/*` to `:8788` (see `vite.config.ts`), so open
**`http://localhost:5173`**. `wrangler` automatically picks up `.dev.vars`.

Other commands:

```bash
npm test        # unit tests for aggregation and dates (vitest)
npm run build   # tsc + build to dist/
npm run lint
```

## Quick data path check (important)

Unit tests only verify aggregation/date logic. The **Notion → proxy → normalization** path
cannot be tested without a token. There's a separate live test that hits the real Notion API
and prints the first meals — run it once to verify that the `2025-09-03` request and Russian
field mapping work **before** deploying:

```powershell
# PowerShell
$env:NOTION_TOKEN="ntn_xxx"; npm test
```
```bash
# bash
NOTION_TOKEN=ntn_xxx npm test
```

Without `NOTION_TOKEN` this test is marked as skipped. Check the printed `meals` output —
dates, names, and macro numbers should look reasonable.

## Deploy to Cloudflare Workers

Deploy via Wrangler (a Git repository is not required):

```bash
# set the production secret (once; same command to update)
npx wrangler secret put NOTION_TOKEN

# build and deploy
npm run deploy            # = npm run build && wrangler deploy
```

After deployment the app is available at
`https://nutrition-dashboard.<your-subdomain>.workers.dev`. Worker name and routing are
defined in `wrangler.jsonc` (`name`, `assets`, `run_worker_first: ["/api/*"]`).
The `NOTION_TOKEN` secret can also be set in the dashboard: **Workers & Pages →
nutrition-dashboard → Settings → Variables and Secrets**.

## Access: Cloudflare Access (Zero Trust)

To keep personal data from being exposed at a public URL, Access is placed in front of the
Worker — a login wall at the Cloudflare edge (requests are checked before any Worker code runs).

1. Dashboard → **Workers & Pages → nutrition-dashboard → Settings →
   Domains & Routes** → on **Worker URL** click **Enable Cloudflare Access**
   (for `*.workers.dev` this is a single click; a policy is created automatically).
2. **Zero Trust → Access → Applications** → open the created application →
   **Policies** → **Allow**, Include → **Emails** → your email. Login method —
   One-time PIN or Google.

Access closes the entire host, including `/api` — the proxy is also protected. A shortcut
opens in the regular browser and shares the Access cookie session with it, so there are no
repeated logins due to isolation.

Additionally (defense-in-depth) the Worker itself validates the signed Access token
`Cf-Access-Jwt-Assertion` — see [`worker/access.ts`](worker/access.ts). For this,
`wrangler.jsonc` has non-secret `vars` **`ACCESS_JWKS_URL`** and **`ACCESS_AUD`**
(values from the Access app dialog: "JWKs URL" and "Audience (aud)"). On `localhost`
(`wrangler dev`) this check is skipped to avoid breaking local development.

## Adding a shortcut to your phone

- **iOS Safari:** Share → "Add to Home Screen".
- **Android Chrome:** ⋮ → "Add to Home Screen".

The shortcut icon is `public/favicon.svg` (+ `apple-touch-icon` if present).

## Configuring goals

Goals (calories / protein / fiber + weight for the protein suggestion 1.6×kg) are edited
directly in the app (⚙️ icon) and stored in the device's `localStorage`. Seed defaults are
in [`src/lib/goals.ts`](src/lib/goals.ts).

## Data source (Notion)

- API model `Notion-Version: 2025-09-03`, endpoint
  `POST /v1/data_sources/{DATA_SOURCE_ID}/query`.
- The `DATA_SOURCE_ID` of the "Питание" (Nutrition) database and field names are hardcoded in
  [`worker/index.ts`](worker/index.ts). Field names are character-perfect Russian
  (`Калории`, `Белок, г`, …) and must not be changed.
- The app **only reads** Notion. No writes.
