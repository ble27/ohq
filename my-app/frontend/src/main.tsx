import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Auth is httpOnly cookies (Supabase session set by the backend), so every
// request needs credentials — set it once globally instead of relying on
// each call site to remember `withCredentials: true`.
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
