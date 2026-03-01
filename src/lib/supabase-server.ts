import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client uses the service role key to bypass RLS.
// Falls back to ANON key if service role key is not set.
// NEVER expose this client to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
