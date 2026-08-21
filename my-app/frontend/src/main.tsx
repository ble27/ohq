import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Auth is httpOnly cookies (Supabase session set by the backend), so every
// request needs credentials — set it once globally instead of relying on
// each call site to remember `withCredentials: true`.
axios.defaults.withCredentials = true;

// Call sites use relative `/api/...` paths. In dev, Vite's proxy (see
// vite.config.ts) forwards those to the local backend, so no baseURL is
// needed. In production the frontend and backend are on different domains
// (Vercel + Render), so point relative paths at the deployed backend.
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
