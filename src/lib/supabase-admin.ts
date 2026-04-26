import { createClient } from '@supabase/supabase-js';

// Admin client — hanya digunakan di server-side API routes
// Bypass RLS, tidak pernah expose ke client/browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
