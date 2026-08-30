# Queueble Features & Technical Notes

## Google OAuth authentication

### Flow

1. User clicks **Log In** → `googleSignIn()` starts Supabase PKCE OAuth.
2. Google redirects back to `{origin}/auth/callback?code=...`.
3. `AuthCallback` **always** exchanges the code via `exchangeCodeForSession(code)`.
4. `POST /api/auth/session` stores `access_token` and `refresh_token` in **httpOnly cookies**.
5. `GET /api/auth/me` verifies the cookie session → user lands on `/dashboard/home`.

### Two session stores (read this before changing auth code)

Queueble keeps auth in **two places**. They serve different jobs and must not be mixed up:

| Store | Where | Used for |
|-------|--------|----------|
| **httpOnly cookies** | Set by Express (`/api/auth/session`) | Real app session — `/me`, protected routes, API calls |
| **Supabase browser session** | `localStorage` via supabase-js | PKCE `code_verifier` during OAuth only |

After login succeeds, the **cookies** are the source of truth. A copy of the tokens may remain in `localStorage` for PKCE; that is expected and not a security issue by itself (httpOnly cookies are what the API reads).

### `signOut({ scope: 'local' })` — when it is safe

`scope: 'local'` clears the browser Supabase session **and revokes that session on the Auth server**. That is correct in some places and fatal in others:

| Location | Call `signOut({ scope: 'local' })`? | Why |
|----------|--------------------------------------|-----|
| **`AuthCallback` after `establishSession()`** | **Never** | Revokes the session whose tokens were just written to httpOnly cookies → `/me` returns 401. |
| **`signOut()` / user logs out** | **Yes** (after API clears cookies) | Drops stale `localStorage` so the next login does not reuse the old account. |
| **`googleSignIn()` before OAuth redirect** | **Yes** | Clears stale browser session before a new account is chosen. OAuth callback then exchanges the fresh `code`. |

**Rule of thumb:** only call `signOut` **before** a new login flow or **after** the user explicitly logs out — never **after** `establishSession()` in the callback.

### Architecture constraints

- **Same-origin API calls:** Frontend always calls relative `/api/...` paths.
  - Dev: Vite proxies to `localhost:3000`.
  - Prod: Vercel rewrites `/api/*` → Render (`vercel.json`).
  - Calling Render directly from the browser breaks first-party cookies (especially Safari ITP).
- **Canonical domain:** Always start OAuth from `queueble.app`, not `www.queueble.app`.
  - PKCE `code_verifier` is stored in that origin's `localStorage`.
  - `main.tsx` and `authService.ts` redirect `www` → apex before sign-in.
- **Supabase dashboard:** Redirect URLs must include:
  - `http://localhost:5173/auth/callback`
  - `https://queueble.app/auth/callback`
- **Google account picker:** `googleSignIn()` uses `prompt: 'select_account consent'` so users can switch Google accounts.

### Auth pitfalls (fixed Aug 2026)

#### 1. Session revoked right after login

**Symptom:** *"Google sign-in succeeded but the app session could not be saved"* or bounce back to sign-in.

**Cause:** `signOut({ scope: 'local' })` in `AuthCallback` immediately after `establishSession()`.

**Fix:** Remove that call. Cookies already hold the live session.

#### 2. Wrong Google account after switching emails

**Symptom:** Signing in with `@tamu.edu` still shows `@gmail.com` (or vice versa).

**Cause:** `AuthCallback` reused a stale `localStorage` session via `getSession()` and **skipped** `exchangeCodeForSession` even though the URL had a new `code`. Sign-out also cleared cookies but left `localStorage` intact.

**Fix:**
- Always `exchangeCodeForSession(code)` when `code` is in the callback URL.
- Call `signOut({ scope: 'local' })` on user sign-out and at the start of `googleSignIn()`.

These two fixes work together: sign-out / pre-OAuth `signOut` clears the old browser session; the callback never calls `signOut` after cookies are set.

#### 3. Do not use `persistSession: false`

Disabling `persistSession` breaks PKCE — the `code_verifier` does not survive Google's redirect and the callback fails with a PKCE error. Keep the default (`true`).

### Real-time notifications (Socket.IO)

- Toasts fire on the `notification-created` socket event in `Dashboard.tsx`.
- **Dev:** Socket connects to `window.location.origin`; Vite proxies `/socket.io` → `localhost:3000` (same pattern as `/api`). `VITE_API_URL` pointing at Render does **not** affect local sockets.
- **Prod:** Socket connects directly to `VITE_API_URL` (Render); Vercel does not proxy WebSockets.
- Token for the handshake comes from `GET /api/auth/socket-token` (httpOnly cookie session).

### Security hardening (app layer)

- **RLS:** Enabled on Supabase tables with no policies — PostgREST denies by default; all data access goes through Express + Prisma.
- **Sign-out:** Revokes all Supabase sessions globally (`admin.signOut` with `global` scope), not just browser cookies.
- **Input validation:** Display names (1–100 chars); Zoom links must be `https://*.zoom.us` on the API.
- **Rate limits:** Per-user caps on notification creation and queue join/leave.
- **CSP:** Production frontend headers in `vercel.json` (`connect-src` includes Render + Supabase).

### Sign-out

User-initiated sign-out (`POST /api/auth/signout` via Sidebar / Settings) clears httpOnly cookies, then clears the Supabase browser session with `signOut({ scope: 'local' })`.
