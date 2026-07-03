# Nightfall — Technical Architecture Plan

> Status: **approved**. Phase 1 (Foundation) ✅ done. Phase 2 (Social core) ✅ done —
> posts/feed, likes, comments, follow graph, report/block, an **admin moderation queue**, and
> **1:1 DMs with realtime delivery** (SSE + in-process bus; see `lib/realtime/`). Remaining in
> Phase 2: stories/reels media upload (needs the storage/transcode pipeline).
> **Phase 3 (A/V rooms)** ✅ provider-agnostic parts done — room lifecycle, Level-5 host gating,
> lobby/room UI, live presence (SSE), host→participant point awards, and a real LiveKit
> token endpoint (`POST /api/livekit/token`) that returns 501 until `LIVEKIT_URL` /
> `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` are set — then audio/video lights up. Rendering the
> actual A/V tracks still needs `@livekit/components-react` + those keys.
> **Phase 4 (Meetups)** ✅ provider-agnostic parts done — discovery (city/date filter), Level-10
> host gating (staff create official/auto-approved; users submit PENDING), admin approval queue,
> booking with a **dev payment** (`Payment` provider=DEV, marked PAID — no real charge) and a
> **frozen 70/30 revenue split** per booking. Real charging needs Stripe/Razorpay keys + swapping
> the DEV block in `lib/meetups/service.ts#bookMeetup`; host payouts = Phase 5.
> **Phase 5 (Trips + payouts)** ✅ provider-agnostic parts done — trip discovery, Level-20 host
> gating, day-by-day itinerary + accommodations + **vendor vetting** (admins vet each third-party
> vendor; a trip can't be approved until all vendors are vetted), booking (dev payment + frozen
> 70/30 split), and a **financial dashboard** with host **payouts**: unpaid earnings aggregate the
> frozen host-shares across meetups + trips, "Create payout" batches them (PENDING, marks bookings
> so they're never double-paid), and "Approve & release" marks PAID — the "automated rails,
> human-gated release" model from §9. Real charging/transfers still need gateway keys. See §7.

## 0. The single most important architectural fact

Nightfall ships **three clients** (iOS, Android, responsive web) against **one product**.
That decision dominates everything: the backend cannot live *inside* the Next.js web app,
because native apps can't call React Server Actions. The Next.js app is the **web client + a
Backend-for-Frontend (BFF)**, while the **system of record is a standalone, client-agnostic API**
shared by all three clients.

---

## 1. Recommended stack

| Concern | Recommendation | Why |
|---|---|---|
| Web client | **Next.js 16 (App Router)** — this repo | SSR for public profiles/events, SSR feed |
| Mobile | **React Native (Expo)** | Reuse TS types/validation with web; store requirement |
| Shared API | **Dedicated service** (NestJS, or Next route handlers promoted later) | Native clients need a non-RSC API |
| DB | **PostgreSQL + Prisma** | Relational backbone; financial integrity needs transactions |
| Cache / presence / leaderboard | **Redis** | Room presence, feed fan-out, ranks via sorted sets |
| Real-time A/V | **LiveKit** (or Agora) | WebRTC SFU — do not build this yourself |
| Realtime text (DMs, chat, presence) | **WebSocket gateway** (LiveKit data channels / Ably / Socket.io) | Distinct from A/V media |
| Media storage | **S3/R2 + CDN**, transcode via **Mux** | Reels/stories/photos need transcode + adaptive streaming |
| Payments | **Stripe** (Connect for payouts) + **Razorpay** if India-first; **native IAP** for digital goods | Store-policy split — see §8 |
| Search/discovery | **Postgres + PostGIS** first; Typesense/Elastic later | Meetups filter by city/date → geo + facet |
| Auth | **Phone OTP + OAuth**, JWT access + refresh, shared across clients | Stranger meetups imply phone verification + trust/safety |
| Background jobs | **Queue** (BullMQ/Redis or SQS) | Payouts, story expiry, transcoding, moderation, notifications |

---

## 2. System topology

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│  Web (Next) │   │ iOS (RN)     │   │ Android (RN)│
└──────┬──────┘   └──────┬───────┘   └──────┬──────┘
       │ Server Actions  │  REST/GraphQL    │
       │ + BFF route     │                  │
       └────────┬────────┴────────┬─────────┘
                ▼                  ▼
        ┌───────────────────────────────┐
        │   Core API (system of record)  │
        │  Auth · Gamification · Bookings │
        │  Payments · Moderation · Social │
        └───┬───────┬────────┬──────┬─────┘
            ▼       ▼        ▼      ▼
       Postgres  Redis   S3/CDN  Queue/Workers
            │
        ┌───┴──────────────┐
        ▼                  ▼
   LiveKit (A/V SFU)   Stripe/Razorpay
```

The web app uses **Server Actions for its own mutations** and a thin **BFF layer**
(`app/api/*` route handlers) only where native parity or webhooks demand a real HTTP endpoint
(Stripe webhooks, LiveKit tokens, push). Authorization is re-checked inside every Server Action —
per the Next 16 docs, actions are reachable via direct POST, not just through your UI.

---

## 3. Core data model (entities & relationships)

```
User ──< PointEntry (ledger, append-only) ──> derives Level/Rank
User ──< UserBadge >── Badge
User ──< Post ──< Comment / Like ; Story (TTL 24h)
User ──< Follow >── User              (social graph)
User ──< DMThread >── User ──< Message

Room (host: User|Nightfall, type) ──< RoomParticipant
Room ──< PointAward (host → user, audited)

Meetup (host, city, date, fee, status: pending|approved|rejected)
   └─< Booking (user, payment, status)
Trip (host, itinerary[], accommodations[], vendors[], status)
   └─< Booking
   └─< VendorVetting (per third-party vendor)

Payment (provider, intent, amount, IAP|gateway)
Payout (host, period, gross, nightfall_cut, net, status)
RevenueSplit (booking → host_share / platform_share)

Report / Block (moderation) · SupportTicket ──< TicketMessage · CallbackRequest
ModerationAction (admin, target, action)
```

**Design rules that matter:**
- **Points are an append-only ledger**, never a mutable integer. Level/rank are *derived* (cached
  in Redis sorted set for leaderboards). Auditable — critical when hosts award points and real
  money/rewards follow.
- **Level gates are server-enforced**, not UI-only: A/V room hosting (L5), meetup hosting (L10),
  trip hosting (L20) checked in the API.
- **Money is integer minor-units** (paise/cents); every booking wrapped in a DB transaction.
  RevenueSplit computed at booking time and frozen, not recomputed at payout.
- Meetups/Trips default to `status = pending` → admin approval before public visibility.

---

## 4. Module → route & API surface map

| Module | Web routes (App Router) | Core API responsibilities |
|---|---|---|
| Profiles & gamification | `/u/[handle]`, `/me` | profile CRUD, points ledger, level/badge derivation, leaderboard |
| A/V rooms | `/rooms`, `/rooms/[id]` | room lifecycle, LiveKit token mint, point awards, host gating (L5) |
| Meetups | `/meetups`, `/meetups/[id]`, `/host/meetup` | discovery (city/date geo), booking+payment, host submission (L10), approval |
| Trips | `/trips`, `/trips/[id]`, `/host/trip` | itinerary/accommodation display, vendor vetting (L20), booking |
| Social feed | `/feed`, `/p/[postId]` | posts/reels/stories, like/comment/share, story TTL job |
| DMs | `/messages`, `/messages/[threadId]` | threads, messages, media, presence (WS) |
| Helpdesk | `/support` | tickets, callback requests, support chat |
| Admin | `(admin)` route group / app | moderation dashboard, vendor vetting, financial dashboard, UGC tools |

Use **route groups** `app/(public)`, `app/(app)`, `app/(admin)` for distinct layouts/auth
boundaries; **parallel routes** for the room (`@stage`, `@chat`); **intercepting routes** for modal
post/story viewers.

---

## 5. Cross-cutting subsystems

- **Gamification engine** — consumes activity events (room win, meetup attended, engagement) →
  writes points ledger → updates Redis leaderboard → unlocks features. Build first; everything gates on level.
- **Payments & payouts** — provider-abstracted; webhook-driven state machine; payouts via Stripe Connect.
- **Trust & safety** — report/block, content moderation (auto-flag + human queue). A **launch blocker** for store approval.
- **Notifications** — push (APNs/FCM), email, in-app; queue-backed.
- **Real-time** — separate **media** (LiveKit/WebRTC) from **data** (DMs/chat/presence over WS).

---

## 6. Repo structure (web app, this repo)

```
app/
  (public)/  u/[handle], meetups, trips, p/[postId]
  (app)/     feed, rooms/[id], messages, host/*, me, support
  (admin)/   moderation, finance, vetting
  api/       stripe/webhook, livekit/token, push      ← route handlers (BFF)
lib/
  auth/  db/(prisma)  gamification/  payments/  realtime/  validation/(zod)
  dto/   ← shared types, candidates for a shared package with RN later
components/ ui/ feed/ rooms/ ...
```

Pull `lib/dto` + validation into a shared workspace package the moment the RN app starts, so web
and mobile validate identically.

---

## 7. Phased roadmap

1. **Foundation** — auth (phone OTP), user/profile, Prisma schema, **points ledger + level engine**, design system. *Nothing gates without levels.*
2. **Social core** — feed (posts/stories/reels), DMs, follow graph, **report/block + moderation queue**.
3. **A/V rooms** — LiveKit integration, Nightfall-hosted rooms, host point awards, L5 user hosting.
4. **Commerce** — Meetups: discovery, payments, booking, admin approval, then host submissions (L10) + rev-split.
5. **Trips & payouts** — itineraries, vendor vetting (L20), Stripe Connect payouts, financial dashboard.
6. **Hardening** — search/geo at scale, anti-abuse on point awards, store submission.

---

## 8. Store-compliance fork (decide before payments)

Apple/Google require **native IAP** (~15–30% cut) for *digital goods* — plausibly including room
"points/coins" if ever purchasable. **Physical/real-world services** (meetups, trips) may and should
use a normal gateway (Stripe/Razorpay). Misclassifying gets apps **rejected**. Architect `payments/`
so the provider is chosen by **product type**, not hardcoded.

## 9. Payout model recommendation

For host payouts under 70/30: **Stripe Connect (Express accounts), automated payouts, gated behind a
manual admin release for the first payout cycle.** Connect handles host KYC, tax forms, and
cross-border compliance. The manual "approve payout" step gives finance a fraud/dispute backstop on
a high-risk stranger-hosted flow; automate the release fully once trust metrics mature. India-first?
Mirror with **RazorpayX / Razorpay Route**. In short: **automated rails, human-gated release at first.**
