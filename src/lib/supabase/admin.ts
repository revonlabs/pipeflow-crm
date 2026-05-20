import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Usado apenas em Server Components e Server Actions (nunca no cliente)
export function getSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
