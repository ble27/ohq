# Queueble Features & Technical Notes

## Google OAuth authentication

### Flow

1. User clicks **Log In** → `googleSignIn()` starts Supabase PKCE OAuth.
2. Google redirects back to `{origin}/auth/callback?code=...`.
3. `AuthCallback` exchanges the code for a Supabase session.
4. `POST /api/auth/session` stores `access_token` and `refresh_token` in **httpOnly cookies**.
5. `GET /api/auth/me` verifies the cookie session → user lands on `/dashboard/home`.

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

### Bug fix: session revoked immediately after login (2026-08)

**Symptom:** Google sign-in succeeded, then either:
- *"Google sign-in succeeded but the app session could not be saved"*, or
- Redirect back to sign-in / landing page after a brief dashboard flash.

**Root cause:** `AuthCallback` called `supabase.auth.signOut({ scope: 'local' })` right after `establishSession()`. Despite the name, this **revokes the current Supabase Auth session** on the server — invalidating the tokens that had just been copied into httpOnly cookies. The next `GET /api/auth/me` then failed.

**Fix:** Do not call `signOut()` after establishing the cookie session. The backend owns session persistence; the Supabase client's browser copy is harmless compared to revoking the live session.

**Do not use as a fix:** `persistSession: false` on the Supabase client — it prevents the PKCE `code_verifier` from surviving Google's redirect and breaks the OAuth callback.

### Sign-out

User-initiated sign-out (`POST /api/auth/signout` via Sidebar / Settings) clears httpOnly cookies and is the correct place to end a session.
