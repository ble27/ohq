import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// vercel.json 301-redirects www → apex, but that only fires on a fresh
// network request to Vercel's edge. A tab restored from bfcache/back-forward
// navigation (or one left open since before that redirect existed) can stay
// on www without ever hitting the edge again. If the OAuth PKCE flow starts
// from such a tab, its code_verifier is written to www's localStorage while
// Google's callback ends up on the apex domain after Vercel redirects the
// callback request — different origin, different storage, exchange fails.
// Canonicalize here, before React (and any sign-in click) can run.
if (window.location.hostname === 'www.queueble.app') {
  window.location.replace(
    `${window.location.protocol}//queueble.app${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

// Auth is httpOnly cookies (Supabase session set by the backend), so every
// request needs credentials — set it once globally instead of relying on
// each call site to remember `withCredentials: true`.
axios.defaults.withCredentials = true;

// Always call relative `/api/...` paths.
// - Dev: Vite proxies /api → localhost:3000 (vite.config.ts)
// - Prod: Vercel rewrites /api → Render (vercel.json)
// Hitting Render cross-origin breaks auth cookies on mobile Safari (ITP).
// Socket.IO still uses VITE_API_URL directly — see SocketProvider.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
