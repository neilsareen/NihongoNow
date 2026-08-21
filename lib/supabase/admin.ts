import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only work that needs to bypass RLS, such as
// writing to Storage on a learner's behalf. Never import this from client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
