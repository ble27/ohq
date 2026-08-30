import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
    supabaseUrl, 
    supabaseKey, {
        auth: {
            flowType: 'pkce', // client stores verifier; server returns auth code; exchange rehashes verifier
            // AuthCallback handles the code exchange manually — leaving this on lets
            // the client race against our handler and can consume the code first.
            detectSessionInUrl: false,
        }
    }
)