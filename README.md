# Queueble

Peer tutoring office hours for Texas A&M University courses.

TAs from any section of a class can open live office-hour queues. Students from any section of that same class can browse those queues and join one. The goal is simple: office hours should not be trapped behind section walls.

> This project is **not affiliated with Texas A&M University**.

---

## Product

### Problem

In large courses, each section often has its own TAs and office hours. A student whose TA is busy (or offline) cannot easily see that another TA for the same course is available right now. Students waste time hunting for help; TAs under-serve students outside their section.

### Approach

Queueble treats the **course**, not the section, as the unit of help:

1. A TA signs in, selects a course, and opens a queue (location and optional Zoom).
2. Any student enrolled in that course sees live queues for that course.
3. The student joins a waitlist; the TA works tickets in order (waiting → helping → done).
4. Realtime notifications keep both sides updated when someone joins, gets helped, or when a queue closes.

### Roles

| Role | What they do |
| --- | --- |
| **Student** | Pick a class, join open queues, leave when done, get notified when helped |
| **TA** | Open/manage queues, run the waitlist + workspace, set location/Zoom |
| **Professor** | Elevated access for course-wide management (admin-style routes) |

---

## Architecture

```
┌─────────────────────┐         same-origin /api + cookies         ┌─────────────────────┐
│  Frontend (Vercel)  │ ──────────────────────────────────────────► │  Backend (Render)   │
│  React + Vite       │ ◄──── Socket.IO (prod: direct to Render) ── │  Express + Socket.IO│
└─────────┬───────────┘                                             └──────────┬──────────┘
          │ Google OAuth (PKCE)                                                 │
          ▼                                                                     ▼
┌─────────────────────┐                                             ┌─────────────────────┐
│  Supabase Auth      │                                             │  PostgreSQL         │
│  (identity only)    │                                             │  (Prisma models)    │
└─────────────────────┘                                             └─────────────────────┘
```

### Why this shape

- **Frontend on Vercel, API on Render** — static SPA + long-lived Socket.IO process.
- **Same-origin `/api` in the browser** — Vercel rewrites `/api/*` to Render so auth cookies stay first-party (critical for Safari). Never call the Render host directly from the client for cookie auth.
- **Supabase for identity, Postgres for app data** — Auth users and `User` rows share the same UUID; roles, queues, tickets, and preferences live in Prisma models.
- **httpOnly cookies as the session source of truth** — The browser Supabase session is only for the OAuth PKCE handshake. After login, Express cookies authenticate API calls.

### Monorepo layout

```
my-app/
  frontend/     React SPA (landing, auth, dashboard)
  backend/      Express API, Socket.IO, cron jobs
  shared/       Types + Zoom URL helpers used by both sides
```

### Core domain model

| Concept | Meaning |
| --- | --- |
| **Course** | Class code students/TAs select (e.g. CSCE 221) |
| **Queue** | One TA’s live office hours for a course (open/closed, location, Zoom, schedule window) |
| **QueueTicket** | A student’s place in a queue (`WAITING` → `HELPING` → `COMPLETED` / `LEFT` / `REMOVED`) |
| **Notification** | Per-user alert (join, leave, assist, close) with preference toggles |

### Backend layers

| Layer | Responsibility |
| --- | --- |
| `routes/` | HTTP endpoints, validation wiring, status codes |
| `schemas/` | Zod input validation |
| `services/` | Queue lifecycle, tickets, notifications, TA presence |
| `middlewares/` | Auth (JWT cookies), authz (role/ownership), rate limits |
| `jobs/` | Cron cleanup of old tickets/notifications |

Notable service behavior:

- **Queue schedule** — open queues outside their time window are closed (rows kept, not deleted).
- **TA presence** — if a TA’s last socket disconnects, open queues auto-close after a grace period; explicit leave/sign-out closes immediately.
- **Concurrency** — join / move-to-helping paths use transactions so two clicks cannot double-book the same student or ticket.

### Frontend surfaces

| Area | Purpose |
| --- | --- |
| Landing | Product pitch + Features / Privacy |
| Auth | Google sign-in → `/auth/callback` → cookie session |
| Class selector | Browse live queues for a course and join |
| Home | Student’s active tickets |
| Queue manager | TA create/edit queues, waitlist, helping workspace |
| Settings | Name, notification prefs, default location, account delete |

### Auth flow (short)

1. User starts Google OAuth on `queueble.app` (apex domain — not `www`).
2. Callback exchanges the PKCE `code` for a Supabase session.
3. Frontend posts tokens to `POST /api/auth/session`; Express sets httpOnly cookies.
4. `GET /api/auth/me` loads the app profile; user lands on the dashboard.

Deeper auth notes (cookie vs `localStorage`, `signOut` pitfalls, Safari ITP) are kept in local engineering notes outside this repo.

### Realtime

- Socket.IO delivers `notification-created` (and related) events to the right user room.
- **Dev:** same-origin; Vite proxies `/socket.io` → local API.
- **Prod:** client connects to the Render host (Vercel does not proxy WebSockets).

---

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Motion |
| Backend | Express, Socket.IO, Zod, Helmet, express-rate-limit |
| Data | PostgreSQL, Prisma |
| Auth | Supabase Auth (Google OAuth / PKCE) |
| Hosting | Vercel (web) · Render (API) |
| CI | GitHub Actions — lint/build frontend, build + Vitest backend |

---

## Local development

**Requirements:** Node.js 22+, npm, a Supabase project, and a Postgres database.

```bash
# API
cd my-app/backend
cp .env.example .env   # if present — otherwise create .env with the vars below
npm install
npx prisma generate
npm run dev            # http://localhost:3000

# Web (separate terminal)
cd my-app/frontend
npm install
npm run dev            # http://localhost:5173
```

### Backend env (typical)

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS` (e.g. `http://localhost:5173`)
- JWT / cookie secrets as used by your auth middleware

### Frontend env (typical)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL` (prod Socket.IO host; local sockets use same-origin via Vite proxy)

### Tests

```bash
cd my-app/backend
npm test
```

API tests mock Prisma, auth, and Supabase. They do not need a live database or real Supabase credentials.

```bash
cd my-app/frontend
npm run lint
npm run build
```

---

## Design decisions worth knowing

1. **Course-scoped queues** — help is shared across sections of the same class.
2. **Closing ≠ deleting** — closed queues remain so TAs can review/manage history; cleanup jobs purge old finished tickets later.
3. **Same-origin API in production** — cookie auth and mobile Safari compatibility.
4. **Cookies over client-held access tokens for the API** — reduces XSS session theft surface for app requests.
5. **Ownership checks in middleware** — routes reuse already-fetched `queue` / `ticket` / `appUser` rows instead of re-querying and re-checking.

---

## License

**Proprietary — All Rights Reserved.**

Copyright © 2026 Bao Le.

This repository is private and shared for evaluation (e.g. recruiters, interviewers) under view-only access. You may not copy, modify, distribute, sublicense, or reuse this source code or its derivatives without explicit written permission from the copyright holder.

**Not MIT.** MIT (and similar open-source licenses) grant broad reuse rights. That is intentionally not offered here.
