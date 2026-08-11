import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
    supabaseUrl, 
    supabaseKey, {
        auth: {
            flowType: 'pkce' // proof key for  code exchange // client: verifier, challenge, server: auth code, and rehash verifier to get challenge
        }
    }
)