# Deploying Nightfall to Vercel

The app is **build-ready** (`npm run build` passes; the build regenerates the Prisma client). The
steps below need **your** credentials — a Vercel login and a cloud database — so they can't be run
from the coding session. Each is quick.

## 1. Get the code on GitHub (Vercel deploys from Git)

```bash
gh repo create nightfall --private --source=. --remote=origin --push
# or: create a repo on github.com, then:
#   git remote add origin https://github.com/<you>/nightfall.git && git push -u origin master
```
`.env` is gitignored — your secrets won't be pushed. Good.

## 2. Provision a cloud Postgres (Vercel can't reach your local `prisma dev` DB)

Pick one and copy its connection string:
- **Prisma Postgres** (easiest): `npx create-db` → gives a `DATABASE_URL`.
- Or **Neon** / **Supabase** / **Vercel Postgres**.

Point your local `.env` `DATABASE_URL` at it temporarily, then create the schema + demo data:

```bash
npx prisma db push        # creates all tables on the cloud DB
npx tsx prisma/seed.ts     # loads demo users/posts/meetups/trips (admin: @mrvij)
```

## 3. Import the project into Vercel

- vercel.com → **Add New → Project** → import the GitHub repo (framework auto-detected: Next.js).
- Under **Environment Variables**, add (see `.env.example`):
  - `DATABASE_URL` — the cloud Postgres string from step 2
  - `AUTH_SECRET` — a fresh secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - `OTP_DEV_MODE` — `true` (so the stakeholder can log in without SMS; the code shows on screen)
- **Deploy.** Then point the `nightfall.club` domain at the project in Vercel → Settings → Domains.

CLI alternative (after `npm i -g vercel` and `vercel login`): run `vercel` then `vercel --prod`,
and set env vars with `vercel env add`.

---

## Serverless-ready ✓

- **Realtime is serverless-friendly.** Live DMs and room presence use short polling (`/api/poll` +
  `RealtimeRefresh`), not long-lived connections — so they work on Vercel serverless and across
  instances (the DB is the shared source of truth). New messages appear within a few seconds. For
  *instant* push later, swap to Ably/Pusher or Redis; polling stays as the fallback.
- **The dev test endpoint was removed** (`/api/dev/send-as` no longer exists).

Feed, rooms, meetups, trips, bookings (simulated payment), admin moderation, and payouts all work on
Vercel as-is. Real A/V, payments, and SMS light up when you add their keys (see `.env.example`).

> Note: keep `OTP_DEV_MODE=true` for the demo so logins show the code on screen (no SMS provider
> needed). Set it to `false` once Twilio is wired.
