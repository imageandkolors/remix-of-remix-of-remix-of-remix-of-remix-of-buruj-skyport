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
   - Supabase PostgreSQL, Supabase Auth with application roles, private Supabase Storage, and server-side Supabase functions/RPCs.

The application is self-hosted as a TanStack Start Node.js service and connects directly to the confirmed Supabase project. Applicant completeness checks are deterministic and remain inside the application/Supabase data boundary; no AI gateway is configured.

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

Use Node.js 22.x (22.12 or newer). The Vite configuration defaults Nitro to the `node-server` preset; the production build emits `.output/server/index.mjs`.

```sh
npm install
npm run build
npm start
```

The `cpanel-start.js` file is the cPanel startup shim. It imports the generated Nitro server, which listens on the `PORT` and `HOST` values supplied by the hosting environment. It is deliberately not named `server.js`, because Nitro auto-detects that filename as a custom server entry during build.

### Configure cPanel

1. In **Setup Node.js App**, select Node.js 22 and use an application root such as `skyport-app`, outside `public_html`.
2. Set the startup file to `cpanel-start.js` and the application URL to the desired domain or subdomain. Back up any existing site before assigning the live domain to this app.
3. Configure the Supabase URL and publishable key for both server and browser builds from the **same Supabase project**. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Node.js application's runtime environment; keep the service-role key server-side only. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SITE_URL` before `npm run build`. Set server-runtime `SITE_URL` to the exact HTTPS public origin used by Supabase Auth invitation redirects.
4. In Supabase Auth URL Configuration, set the production Site URL and allow the exact `${SITE_URL}/auth` invitation callback. Configure production email delivery (SMTP) for admin invitations and enable leaked-password protection; the staging Security Advisor currently reports this protection as disabled. Use `SUPABASE_DB_URL` only if running the optional Drizzle CLI; keep it server-side. Never commit populated secrets or give secrets a `VITE_` prefix.
5. Review [`drizzle/MIGRATIONS.md`](drizzle/MIGRATIONS.md), compare the target database with the numbered SQL files, and apply only outstanding migrations through `0023` before exposing the app. Do not replay migrations blindly. The final sequence `0019`–`0023` covers admin user management, contact/trial rate limiting, service-role-only Web Push storage, deleted-user revocation, and foreign-key indexes. Verify that the `application-documents` and `player-documents` buckets remain private with their intended MIME/size restrictions. The staging `site-media` bucket is public for marketing imagery; confirm production bucket visibility deliberately.
6. Configure trusted-proxy IP rate limits at the production CDN/WAF for application submissions, parent-access requests, CV requests, application uploads, contact enquiries, and trial registrations before exposing public endpoints. Database identity limits do not replace edge IP throttling. Then install dependencies, run `npm run build` from the application root, and restart the Node.js app in cPanel.

The checked-in `supabase/config.toml` targets the `buruj-skyport-staging` project. Confirm the production project separately before running any CLI migration or deployment command against production.

### Troubleshooting admin data screens

The `/users` page, public enquiries/trial inbox, and admin notifications use the server-only Supabase admin client. If a screen fails while sign-in works, set `SUPABASE_SERVICE_ROLE_KEY` in the deployment's server environment (for Vercel: **Project Settings → Environment Variables**; for cPanel: **Setup Node.js App → Environment variables**). Do not use a `VITE_` prefix. The key must belong to the same project as `SUPABASE_URL` and the build-time `VITE_SUPABASE_URL`; redeploy on Vercel or restart the Node.js app on cPanel after changing it. Also confirm the target project has the admin-user migrations (`0019` and `0022`) and public contact/trial migration (`0020`) applied. Never work around this by exposing the service-role key or adding public table policies.

GitHub is optional. You can transfer the source with FTP or upload a ZIP through File Manager; Git integration only automates fetching future code changes.

## Admin user management

Administrators can open **Admin → Users** at `/users` to invite new users, assign or revoke the parent, player, coach, admin, and owner roles, suspend or reactivate accounts, and permanently delete accounts. Auth administration runs only in server functions with the Supabase service-role key; it is never exposed to the browser. The connected Supabase project enforces the matching safeguards in its admin user-management migration: only owners can manage owner accounts, administrators cannot manage themselves, and the final active owner or administrator cannot be removed.

## Deployment targets

The repository keeps the Node.js server as the default build so the same source works on cPanel, Railway, Fly.io, Docker, and a regular VPS. Provider-specific files are committed at the repository root:

- `Dockerfile` is the production image for Fly.io, Railway Docker deployments, and other container hosts.
- `fly.toml` configures the Docker image, HTTPS, health checks, and a continuously running machine for Web Push delivery.
- `railway.json` configures the standard `npm run build` and `npm start` flow for Railway.
- `vercel.json` selects the Nitro Vercel build through `npm run build:vercel`.
- `netlify.toml` selects the Nitro Netlify build through `npm run build:netlify`.
- `cpanel-start.js` remains the cPanel startup file for the Node.js application manager.

For **Vercel**, import this GitHub repository into Vercel and keep the root directory at the repository root. Vercel will build from `vercel.json`; every push to `main` will deploy when the repository is connected. For **Railway**, connect the GitHub repository and let Railway use `railway.json`. For **Fly.io**, install `flyctl`, set the secrets, then run `fly launch --no-deploy` followed by `fly deploy`. For **Netlify**, connect the repository and use the committed `netlify.toml`; the Nitro Netlify preset produces the server function and public assets. For cPanel, use the existing Node.js App setup above.

All providers need the Supabase variables in `.env.example`. Providers that run server functions also need `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` for push delivery. Generate the VAPID pair once with `npx web-push generate-vapid-keys`; store the private key only in the provider's server-side secrets. `VAPID_PUBLIC_KEY` is returned to browsers by the server function and must not be placed in a `VITE_` variable. Rebuild after changing any `VITE_*` variable.

Before the first deployment, apply the outstanding SQL files in `drizzle/migrations` in order, including `0021_push_notifications.sql`, and verify that the target provider is running Node.js 22.12 or newer. Users must grant notification permission once per browser/device; after that, the service worker can receive notifications while the PWA is closed.

References: [Namecheap's Node.js app guide](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/) and [TanStack Start's hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
