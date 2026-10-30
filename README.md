# Buruj Skyport

Build the full-stack web application for Buruj Sports Academy based on the attached prompt pack (buruj prompt.pdf).

Key requirements:

1. Brand Design System & Tokens:
   - Palette: Sky Blue, Vibrant Gold, Deep Navy/Midnight, and Clean White inspired by the official Buruj FC & Sports Academy crest.
   - Typography: Barlow Condensed for athletic display headlines and badges; Barlow for clean body copy.
   - Motion & Transitions: Animated hero slider, smooth rise-in card reveals, hover glow states, and interactive tabs.

2. Core Public Website:
   - Dynamic Hero Banner Slider: High-impact carousel highlighting elite football development, residential Play & Study, international trials (UK, Spain, Italy), and the Ikorodu campus.
   - Animated Stats Bar: Years of excellence (Est. 2013), residential boarding, trial showcase countries, and NFF/LSFA coaching certifications.
   - Interactive Program Cards: Detailed comparison for Play & Study (Ages 9-18, JSS 1 - SS 3) and Football Camping (Ages 9-22) with inclusions, trial pathway, and admin-configurable fee placeholders.
   - "Find Your Pathway" 3-step interactive finder/quiz.
   - About Section: History since 2013, founder Dr. Salaudeen Waheed Buruj, club patron and matron, coaching philosophy, and dual-team safety model (Coaching + 24/7 Welfare Team).
   - Media & Matchday Gallery: Photo/video highlights and recent news updates.
   - Admissions & Application Preview: Admission process breakdown, requirements, and trial match registration.
   - Contact & Campus Info: 8, Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos, direct WhatsApp links, and enquiry form.

3. Backend & Database Foundation:
   - Structured for Supabase / Lovable Cloud (PostgreSQL, Supabase Auth with roles for visitor, parent, player, coach, and admin, and storage for player media/documents).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1caa9e86-b687-452f-a30b-1039894e731e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Self-hosting on Namecheap cPanel (Node.js)

This is a full-stack TanStack Start application with server-rendered routes and server functions. It must run as a Node.js application; uploading only a static `dist` folder is not sufficient.

### Build and run locally

Use Node.js 22.x (22.12 or newer). The Vite configuration pins Nitro to the `node-server` preset, and the production build emits `.output/server/index.mjs`.

```sh
npm install
npm run build
npm start
```

The `cpanel-start.js` file is the cPanel startup shim. It imports the generated Nitro server, which listens on the `PORT` and `HOST` values supplied by the hosting environment. It is deliberately not named `server.js`, because Nitro auto-detects that filename as a custom server entry during build.

### Configure cPanel

1. In **Setup Node.js App**, select Node.js 22 and use an application root such as `skyport-app`, outside `public_html`.
2. Set the startup file to `cpanel-start.js` and the application URL to the desired domain or subdomain. Back up any existing site before assigning the live domain to this app.
3. Add the required environment variables from `.env.example` in the application settings. Public routes need `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`; set `VITE_SITE_URL` to the real HTTPS production origin before building so article canonicals/share links do not point to a preview host. Privileged admin/media operations also need `SUPABASE_SERVICE_ROLE_KEY`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` server-side. Never give them a `VITE_` prefix or commit a populated `.env` file. `VITE_*` values are embedded at build time, so rebuild after changing them. The `LOVABLE_CRON_SECRET*` variables are currently unused; this repository ships no in-app cron endpoint.
5. Review [`drizzle/MIGRATIONS.md`](drizzle/MIGRATIONS.md), compare the target database with the numbered SQL files, and apply only outstanding migrations (including `0009`–`0020`) before exposing the app. Do not replay migrations blindly against an existing database. In particular, the upload-ticket code requires `0014`, shared rate limiting requires `0016`, caller-bound role checks require `0017`, private-schema role wrappers require `0018`, public contact/trial rate limiting requires `0019`, and Web Push subscriptions require `0020`; verify the `application-documents` bucket remains private and enforces the 20 MiB/MIME restrictions after migration.
6. Configure trusted-proxy IP rate limits at the production CDN/WAF for application submissions, parent-access requests, CV requests, and application uploads before exposing public endpoints. The database also enforces per-email/application limits, but those do not replace IP throttling. Then install dependencies, run `npm run build` from the application root, and restart the Node.js app in cPanel.

GitHub is optional. You can transfer the source with FTP or upload a ZIP through File Manager; Git integration only automates fetching future code changes.

## Deployment targets

The repository keeps the Node.js server as the default build so the same source works on cPanel, Railway, Fly.io, Docker, and a regular VPS. The provider-specific files are committed at the repository root:

- `Dockerfile` is the production image for Fly.io, Railway Docker deployments, and other container hosts.
- `fly.toml` configures the Docker image, HTTPS, health checks, and a continuously running machine for Web Push delivery.
- `railway.json` configures the standard `npm run build` and `npm start` flow for Railway.
- `vercel.json` selects the Nitro Vercel build through `npm run build:vercel`.
- `netlify.toml` selects the Nitro Netlify build through `npm run build:netlify`.
- `cpanel-start.js` remains the cPanel startup file for the Node.js application manager.

For **Vercel**, import this GitHub repository into Vercel and keep the root directory at the repository root. Vercel will build from `vercel.json`; every push to `main` will deploy when the repository is connected. For **Railway**, connect the GitHub repository and let Railway use `railway.json`. For **Fly.io**, install `flyctl`, set the secrets, then run `fly launch --no-deploy` followed by `fly deploy`. For **Netlify**, connect the repository and use the committed `netlify.toml`; the Nitro Netlify preset produces the server function and public assets. For cPanel, use the existing Node.js App setup described above.

All providers need the Supabase variables in `.env.example`. Providers that run server functions also need `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` for push delivery. Generate the VAPID pair once with `npx web-push generate-vapid-keys`; store the private key only in the provider's server-side secrets. `VAPID_PUBLIC_KEY` is returned to browsers by the server function and must not be placed in a `VITE_` variable. Rebuild after changing any `VITE_*` variable.

Before the first deployment, apply the outstanding SQL files in `drizzle/migrations` in order, including `0020_push_notifications.sql`, and verify that the target provider is running Node.js 22.12 or newer. Users must grant notification permission once per browser/device; after that, the service worker can receive notifications while the PWA is closed.

References: [Namecheap's Node.js app guide](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/) and [TanStack Start's hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
