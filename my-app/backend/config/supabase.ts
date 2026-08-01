import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in backend/.env');
}

// Initialize the client for server-side operations
export const supabase = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    persistSession: false, // CRITICAL: Prevents server from mixing up different user sessions in memory
    autoRefreshToken: false // Express will handle token rotation manually via cookies
  }
});
